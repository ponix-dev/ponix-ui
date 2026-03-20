# Plate + Yrs Frontend Integration Guide

This guide documents how to connect a [Plate](https://platejs.org/) (React rich-text editor) to the Ponix collaboration server using [Yrs](https://github.com/y-crdt/y-crdt) / [Yjs](https://yjs.dev/). It describes the **post-migration API** (after roadmap issues #168-#174 land in `ponix-rs`), since that is what the frontend will integrate with.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  ┌──────────────┐    ┌─────────────┐    ┌────────────────────┐  │
│  │   Plate      │◄──►│  slate-yjs  │◄──►│  Custom WS         │  │
│  │   (React)    │    │  (binding)  │    │  Provider (Yjs)    │  │
│  └──────────────┘    └─────────────┘    └────────┬───────────┘  │
│                                                  │ WebSocket    │
│  ┌──────────────────────────────────┐            │              │
│  │  Connect-Web (gRPC-Web client)  │            │              │
│  └──────────────┬───────────────────┘            │              │
│                 │ gRPC-Web (HTTP/1.1)            │              │
└─────────────────┼────────────────────────────────┼──────────────┘
                  │                                │
                  ▼                                ▼
          ┌──────────────┐              ┌─────────────────────┐
          │  ponix_api   │              │ collaboration_server│
          │  port 50051  │              │  port 50052         │
          │  (gRPC-Web)  │              │  (WebSocket)        │
          └──────┬───────┘              └──────────┬──────────┘
                 │                                 │
                 ▼                                 ▼
          ┌──────────────────────────────────────────────┐
          │              PostgreSQL                       │
          │  documents | document_comments |              │
          │  document_versions | junction tables          │
          └──────────────────────────────────────────────┘
```

**Two connections per document session:**

| Connection | Protocol | Port | Purpose |
|---|---|---|---|
| gRPC-Web | HTTP/1.1 | 50051 | CRUD for documents and associations (name/metadata only — not content) |
| WebSocket | WS | 50052 | Real-time editing, sync, and presence via Yjs-compatible binary protocol |

---

## 2. Prerequisites

### npm packages

```bash
# Plate editor
npm install @udecode/plate @udecode/plate-common

# Yjs ↔ Slate binding
npm install @slate-yjs/core @slate-yjs/react

# Yjs core (no y-websocket — we use a custom provider for first-message auth)
npm install yjs

# gRPC-Web client (Connect protocol)
npm install @connectrpc/connect @connectrpc/connect-web @bufbuild/protobuf
```

### Generated code

Generate TypeScript types from the `ponix-protobuf` repo using `buf generate`. The guide assumes generated types are available at `@ponix/proto`.

---

## 3. Plate + slate-yjs Editor Setup

> **Note:** We use a custom WebSocket provider (not `y-websocket`) because the Ponix collaboration server requires the JWT to be sent as the **first text frame** after connecting, rather than as a query parameter.

```tsx
import { useEffect, useMemo, useState } from "react";
import { Plate, PlateContent } from "@udecode/plate-common/react";
import { withYjs, YjsEditor, withCursors } from "@slate-yjs/core";
import { RemoteCursorOverlay } from "@slate-yjs/react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { createPlateEditor } from "@udecode/plate-common";

interface CollaborativeEditorProps {
  documentId: string;
  authToken: string;
  /** collaboration_server host, e.g. "localhost:50052" */
  wsHost: string;
}

export function CollaborativeEditor({
  documentId,
  authToken,
  wsHost,
}: CollaborativeEditorProps) {
  const [connected, setConnected] = useState(false);

  // Create a Yjs document and shared type
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const sharedType = useMemo(
    () => ydoc.get("content", Y.XmlText) as Y.XmlText,
    [ydoc]
  );
  const awareness = useMemo(() => new Awareness(ydoc), [ydoc]);

  // Connect via custom WebSocket with first-message JWT auth
  useEffect(() => {
    const wsUrl = `ws://${wsHost}/ws/documents/${documentId}`;
    const ws = new WebSocket(wsUrl);

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      // First message MUST be the JWT as a text frame
      ws.send(authToken);
    };

    ws.onmessage = (event) => {
      const data = new Uint8Array(event.data as ArrayBuffer);
      if (data.length === 0) return;

      const tag = data[0];
      const payload = data.slice(1);

      if (tag === 0x00) {
        // Sync protocol message
        handleSyncMessage(ydoc, payload, ws);
      } else if (tag === 0x01) {
        // Awareness protocol message
        awareness.applyUpdate(payload, ws);
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      if (event.code === 4001) {
        console.error("WebSocket auth failed — invalid JWT");
        // Redirect to login or refresh token
      }
    };

    setConnected(true);

    // Send local awareness updates to the server
    const onAwarenessUpdate = ({ added, updated, removed }: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        const changedClients = added.concat(updated).concat(removed);
        const update = awareness.encodeUpdate(changedClients);
        const msg = new Uint8Array(1 + update.length);
        msg[0] = 0x01; // Awareness tag
        msg.set(update, 1);
        ws.send(msg);
      }
    };
    awareness.on("update", onAwarenessUpdate);

    // Send local Yjs updates to the server
    const onDocUpdate = (update: Uint8Array) => {
      if (ws.readyState === WebSocket.OPEN) {
        const msg = new Uint8Array(3 + update.length);
        msg[0] = 0x00; // Sync tag
        msg[1] = 0x02; // SyncUpdate sub-tag
        msg.set(update, 2);
        // Note: offset is 2 because the wire format is [0x00][0x02][...update...]
        ws.send(msg);
      }
    };
    ydoc.on("update", onDocUpdate);

    return () => {
      awareness.off("update", onAwarenessUpdate);
      ydoc.off("update", onDocUpdate);
      ws.close();
    };
  }, [ydoc, awareness, documentId, authToken, wsHost]);

  // Build a Plate editor with Yjs binding + cursor awareness
  const editor = useMemo(() => {
    const base = createPlateEditor();
    const withYjsEditor = withYjs(base, sharedType);
    return withCursors(withYjsEditor, awareness, {});
  }, [sharedType, awareness]);

  // Connect/disconnect the Yjs editor
  useEffect(() => {
    YjsEditor.connect(editor);
    return () => YjsEditor.disconnect(editor);
  }, [editor]);

  return (
    <Plate editor={editor}>
      <div style={{ position: "relative" }}>
        <RemoteCursorOverlay />
        <PlateContent placeholder="Start writing..." />
      </div>
      {!connected && (
        <div className="connection-status">Reconnecting...</div>
      )}
    </Plate>
  );
}

/**
 * Handle incoming Yjs sync protocol messages.
 * The server initiates sync by sending SyncStep1 + SyncStep2.
 */
function handleSyncMessage(ydoc: Y.Doc, payload: Uint8Array, ws: WebSocket) {
  const subTag = payload[0];
  const data = payload.slice(1);

  switch (subTag) {
    case 0x00: {
      // SyncStep1 from server — server's state vector
      // Respond with SyncStep2 containing updates the server is missing
      const update = Y.encodeStateAsUpdate(ydoc, data);
      const msg = new Uint8Array(2 + update.length);
      msg[0] = 0x00; // Sync tag
      msg[1] = 0x01; // SyncStep2 sub-tag
      msg.set(update, 2);
      ws.send(msg);
      break;
    }
    case 0x01:
      // SyncStep2 from server — full document state
      Y.applyUpdate(ydoc, data);
      break;
    case 0x02:
      // SyncUpdate — incremental update from another client
      Y.applyUpdate(ydoc, data);
      break;
  }
}
```

---

## 4. WebSocket Connection

### Endpoint

```
ws://{host}:50052/ws/documents/{document_id}
```

TLS in production:

```
wss://{host}:50052/ws/documents/{document_id}
```

### Authentication

The **first message** sent after connecting must be the JWT as a **text frame**. The server validates it and resolves the user identity. On failure, the socket closes with code **4001**.

```ts
const ws = new WebSocket(`ws://localhost:50052/ws/documents/${documentId}`);
ws.onopen = () => {
  ws.send(authToken); // First message: JWT as text frame
};
ws.onclose = (event) => {
  if (event.code === 4001) {
    // Auth failed — redirect to login or refresh token
  }
};
```

> **Note:** Because auth uses the first text frame (not a query parameter), the standard `y-websocket` provider cannot be used out of the box. Use a custom WebSocket provider as shown in Section 3.

### Yjs-Compatible Binary Protocol

After authentication, all messages are **binary frames** using a Yjs-compatible protocol with a leading tag byte.

#### Sync Protocol (tag byte `0x00`)

The **server initiates sync** automatically on connect by sending:

1. **SyncStep1** `[0x00][0x00][...state_vector...]` — the server's state vector
2. **SyncStep2** `[0x00][0x01][...full_document_state...]` — the full document

The client should respond to SyncStep1 with its own SyncStep2 containing any updates the server is missing (for reconnection scenarios). For a fresh client with no local state, this response can be empty.

Ongoing edits are sent as incremental updates:

- **SyncUpdate** `[0x00][0x02][...yrs_update_bytes...]`

The server broadcasts these to all other connected clients on the same document (including across server instances via NATS relay).

| Message | Wire Format | Direction | Purpose |
|---|---|---|---|
| SyncStep1 | `[0x00][0x00][state_vector]` | Server → Client | Server sends its state vector |
| SyncStep2 | `[0x00][0x01][document_state]` | Bidirectional | Full document state / missing updates |
| SyncUpdate | `[0x00][0x02][update]` | Bidirectional | Incremental document changes |

#### Awareness Protocol (tag byte `0x01`)

Used for presence and cursor tracking. Messages are `[0x01][...awareness_payload...]`.

Awareness payload format (Yjs-compatible, little-endian):
- `[num_updates: u32][client_id: u64][clock: u32][state_len: u32][state_json]`

User presence state (the JSON in awareness):
- `user_id`, `name`, `email` — identity (**server-authoritative**)
- `color` — deterministic hex color derived from `user_id`
- `cursor` — `{ index: u32, length: u32 }` representing selection

When a user disconnects, the server broadcasts a removal (`state_len = 0`). New clients receive a full awareness state snapshot on connect.

### Reconnection Strategy

Since we use a custom WebSocket provider, reconnection must be handled manually. Implement exponential backoff:

```ts
function connectWithRetry(url: string, token: string, maxBackoff = 10000) {
  let delay = 1000;
  function connect() {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      delay = 1000; // Reset on successful connect
      ws.send(token);
    };
    ws.onclose = (event) => {
      if (event.code === 4001) return; // Auth failure — don't retry
      setTimeout(connect, delay);
      delay = Math.min(delay * 2, maxBackoff);
    };
    return ws;
  }
  return connect();
}
```

All changes made while offline are stored in the local Yjs document and synced automatically on reconnect — no data loss.

---

## 5. gRPC-Web Client Setup

### Transport

```ts
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient, type Interceptor } from "@connectrpc/connect";
import { DocumentService } from "@ponix/proto/document/v1/document_connect";

/** Auth interceptor — adds Bearer token to every request */
const authInterceptor: (token: string) => Interceptor =
  (token) => (next) => async (req) => {
    req.header.set("Authorization", `Bearer ${token}`);
    return next(req);
  };

export function createDocumentClient(apiHost: string, token: string) {
  const transport = createGrpcWebTransport({
    baseUrl: `http://${apiHost}`,
    interceptors: [authInterceptor(token)],
  });

  return createClient(DocumentService, transport);
}
```

### Default configuration

| Setting | Value | Notes |
|---|---|---|
| Port | 50051 | Same port as all Ponix gRPC services |
| gRPC-Web | Enabled by default | `PONIX_GRPC_WEB_ENABLED=true` |
| CORS | `*` (all origins) | Configurable via `PONIX_GRPC_CORS_ALLOWED_ORIGINS` |
| Auth header | `Authorization: Bearer <jwt>` | Matches `extract_user_context` in `common/src/grpc/context.rs` |

---

## 6. Document Lifecycle

All endpoints are on the `DocumentService` in the `document.v1` proto package. They require a JWT in gRPC metadata for auth. **Content is NOT updated via gRPC** — the `Update*Document` endpoints only change name/metadata. All content editing flows through the WebSocket + Yrs protocol. The server handles snapshotting the CRDT state to PostgreSQL in the background, which is how `content_text` and `content_html` get populated for search/display in list views.

### Standalone RPCs

```ts
const client = createDocumentClient("localhost:50051", token);

// Fetch a single document by ID
const { document } = await client.getDocument({
  documentId: "doc-abc123",
  organizationId: "org-001",
});

// Document fields:
// - document_id, organization_id, name, metadata (JSON)
// - content_text (plain text snapshotted from Yrs)
// - content_html (HTML snapshotted from Yrs)
// - created_at, updated_at

// Soft-delete a document
await client.deleteDocument({
  documentId: "doc-abc123",
  organizationId: "org-001",
});
```

### Association RPCs

Documents are always created in the context of an association (data stream, definition, or workspace). The pattern is consistent across all three: **Create**, **Update** (name/metadata only), **Unlink**, and **List**.

#### Data Stream Documents

```ts
// Create + link in one call
const { document } = await client.createDataStreamDocument({
  dataStreamId: "ds-xyz789",
  organizationId: "org-001",
  name: "Sensor Installation Guide",
  metadata: { category: "manual", version: "1.0" },
});
// document.documentId is now available — open WebSocket to start editing

// Update name/metadata (NOT content — content goes through WebSocket)
await client.updateDataStreamDocument({
  documentId: "doc-abc123",
  dataStreamId: "ds-xyz789",
  organizationId: "org-001",
  name: "Updated Guide Name",
});

// Remove association (does not delete the document)
await client.unlinkDocumentFromDataStream({
  documentId: "doc-abc123",
  dataStreamId: "ds-xyz789",
  organizationId: "org-001",
});

// List all documents for a data stream
const { documents } = await client.listDataStreamDocuments({
  dataStreamId: "ds-xyz789",
  organizationId: "org-001",
});
```

#### Definition Documents

Same pattern: `createDefinitionDocument`, `updateDefinitionDocument`, `unlinkDocumentFromDefinition`, `listDefinitionDocuments`.

#### Workspace Documents

Same pattern: `createWorkspaceDocument`, `updateWorkspaceDocument`, `unlinkDocumentFromWorkspace`, `listWorkspaceDocuments`.

---

## 7. Comments

After #173, documents support threaded comments anchored to specific positions in the text using Yrs `StickyIndex`.

### Comment Data Model

```ts
interface DocumentComment {
  commentId: string;
  documentId: string;
  userId: string;
  /** Yrs StickyIndex — survives concurrent edits */
  anchorIndex: Uint8Array;
  content: string;
  parentCommentId?: string; // For threaded replies
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Creating a Comment from Slate Selection

When a user selects text and adds a comment, convert the Slate selection to a Yrs `StickyIndex` for durable anchoring:

```ts
import * as Y from "yjs";
import { Editor } from "slate";

function createCommentFromSelection(
  editor: Editor,
  ydoc: Y.Doc,
  content: string,
  client: ReturnType<typeof createDocumentClient>,
  documentId: string,
  organizationId: string
) {
  const { selection } = editor;
  if (!selection) return;

  // Get the Yjs shared type
  const sharedType = ydoc.get("content", Y.XmlText) as Y.XmlText;

  // Convert Slate offset to a Yjs StickyIndex
  // StickyIndex survives concurrent insertions/deletions
  const stickyIndex = Y.createStickyIndexFromRelativePosition(
    Y.createRelativePositionFromTypeIndex(sharedType, selection.anchor.offset),
    ydoc
  );

  // Serialize the sticky index for storage
  const anchorBytes = Y.encodeStickyIndex(stickyIndex);

  // Create comment via gRPC
  client.createComment({
    documentId,
    organizationId,
    anchorIndex: anchorBytes,
    content,
  });
}
```

### Threaded Replies

```ts
// Reply to an existing comment
await client.createComment({
  documentId: "doc-abc123",
  organizationId: "org-001",
  parentCommentId: "comment-parent-id", // Creates a thread
  content: "Good point, I'll update this section.",
});
```

### Resolve / Unresolve

```ts
// Resolve a comment thread
await client.resolveComment({
  commentId: "comment-abc",
  documentId: "doc-abc123",
  organizationId: "org-001",
});

// Unresolve
await client.unresolveComment({
  commentId: "comment-abc",
  documentId: "doc-abc123",
  organizationId: "org-001",
});
```

### Rendering Comment Markers

To display comment markers in the editor, decode stored `StickyIndex` values back to Slate positions:

```ts
function getCommentPosition(
  anchorBytes: Uint8Array,
  ydoc: Y.Doc
): number | null {
  const stickyIndex = Y.decodeStickyIndex(anchorBytes);
  const absPos = Y.createAbsolutePositionFromStickyIndex(stickyIndex, ydoc);
  return absPos?.index ?? null;
}
```

---

## 8. Version History

After #174, documents support named snapshots of the full Yrs state.

### Creating a Snapshot

```ts
// Save current document state as a named version
await client.createDocumentVersion({
  documentId: "doc-abc123",
  organizationId: "org-001",
  name: "v2.0 — Added calibration section",
});
```

### Listing Versions

```ts
const { versions } = await client.listDocumentVersions({
  documentId: "doc-abc123",
  organizationId: "org-001",
});

// Each version contains:
// - versionId, documentId, name
// - contentText (plain text at time of snapshot)
// - createdAt
```

### Viewing a Past Version

```ts
const { version } = await client.getDocumentVersion({
  versionId: "ver-xyz",
  documentId: "doc-abc123",
  organizationId: "org-001",
});

// version.contentText — full plain text at that point in time
// version.contentHtml — full HTML at that point in time
```

### Diff Display

Compare `contentText` between two versions to show what changed:

```ts
// Use any text diff library (e.g., diff, jsdiff)
import { diffLines } from "diff";

const changes = diffLines(olderVersion.contentText, newerVersion.contentText);
// Render additions (green) and removals (red) in the UI
```

### Restoring a Version

```ts
// Restores the Yrs state to the snapshot — all connected editors
// will see the restored content via the sync protocol
await client.restoreDocumentVersion({
  versionId: "ver-xyz",
  documentId: "doc-abc123",
  organizationId: "org-001",
});
```

> **Note:** Restoring a version replaces the current Yrs document state. All connected WebSocket clients receive the update automatically via the Yjs sync protocol. This is a destructive operation — consider creating a snapshot before restoring.

---

## 9. Error Handling

### gRPC Status Code Mapping

The backend maps domain errors to gRPC status codes. Handle these in the frontend:

| gRPC Status | Meaning | Frontend Action |
|---|---|---|
| `UNAUTHENTICATED` | Missing or invalid Bearer token | Redirect to login |
| `PERMISSION_DENIED` | User lacks access to resource | Show forbidden message |
| `NOT_FOUND` | Document / comment / version doesn't exist | Show not-found state |
| `ALREADY_EXISTS` | Duplicate association link | Ignore or show info |
| `INVALID_ARGUMENT` | Bad request payload | Show validation error |
| `INTERNAL` | Server error | Show generic error, retry |

```ts
import { ConnectError, Code } from "@connectrpc/connect";

try {
  await client.getDocument({ documentId, organizationId });
} catch (err) {
  if (err instanceof ConnectError) {
    switch (err.code) {
      case Code.Unauthenticated:
        redirectToLogin();
        break;
      case Code.NotFound:
        showNotFound();
        break;
      default:
        showError(err.message);
    }
  }
}
```

### WebSocket Reconnection

Since we use a custom WebSocket provider (see Section 4), reconnection must be handled manually with exponential backoff. The WebSocket close code **4001** indicates an auth failure and should not be retried — redirect to login instead.

All local edits are preserved in the Yjs document during disconnection and synced automatically on reconnect.

### CRDT Conflict Resolution

Yrs/Yjs handles conflict resolution automatically. There are no merge conflicts — concurrent edits from multiple users are resolved deterministically by the CRDT algorithm. No special handling is required in the frontend.
