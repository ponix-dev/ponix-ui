'use client';

/**
 * Remote cursor rendering via Slate decorations.
 *
 * Instead of absolute-positioned overlays (which drift during scroll),
 * this injects decorations into the Slate render tree. Decorated text
 * scrolls with content natively — zero lag.
 */

import { useCallback, useEffect, useState } from 'react';
import { CursorEditor, relativeRangeToSlateRange } from '@slate-yjs/core';
import { useEditorRef } from 'platejs/react';
import type { TRange, NodeEntry } from 'platejs';

type CursorData = Record<string, unknown> & {
  name?: string;
  color?: string;
};

interface RemoteCursorDecoration extends TRange {
  remoteCursor: {
    clientId: string;
    name?: string;
    color: string;
    isCollapsed: boolean;
  };
}

function resolveUserInfo(
  awareness: { states: Map<number, Record<string, unknown>> },
  clientId: string,
  cursorData?: CursorData,
) {
  if (cursorData?.name) {
    return { name: cursorData.name, color: (cursorData.color || '#6b7280') as string };
  }
  const rawState = awareness.states.get(Number(clientId));
  if (rawState) {
    return {
      name: rawState.name as string | undefined,
      color: (rawState.color as string) || '#6b7280',
    };
  }
  return { name: undefined, color: '#6b7280' };
}

/**
 * Hook that provides a `decorate` function for remote cursors.
 * Pass to the Editor's decorate prop.
 */
export function useRemoteCursorDecorations() {
  const editor = useEditorRef();
  const [, forceUpdate] = useState(0);

  // Re-render when remote cursors change
  useEffect(() => {
    if (!CursorEditor.isCursorEditor(editor)) return;

    const handler = () => forceUpdate((n) => n + 1);
    CursorEditor.on(editor, 'change', handler);
    return () => CursorEditor.off(editor, 'change', handler);
  }, [editor]);

  const decorate = useCallback(
    ({ entry: [, path] }: { entry: NodeEntry }): RemoteCursorDecoration[] => {
      if (!CursorEditor.isCursorEditor(editor)) return [];

      const states = CursorEditor.cursorStates<CursorData>(editor);
      const decorations: RemoteCursorDecoration[] = [];
      const stateEntries = Object.entries(states);

      for (const [clientId, state] of stateEntries) {
        if (!state.relativeSelection) continue;

        try {
          const range = relativeRangeToSlateRange(
            editor.sharedRoot,
            editor,
            state.relativeSelection,
          ) as TRange | null;

          if (!range) continue;

          // Only decorate if the range intersects this node's path
          const { anchor, focus } = range;
          const isRelevant =
            anchor.path[0] === path[0] || focus.path[0] === path[0];
          if (!isRelevant && path.length > 0) continue;

          const { name, color } = resolveUserInfo(
            editor.awareness,
            clientId,
            state.data,
          );

          const isCollapsed =
            anchor.path.every((v, i) => v === focus.path[i]) &&
            anchor.offset === focus.offset;

          decorations.push({
            ...range,
            remoteCursor: { clientId, name, color, isCollapsed },
          });
        } catch {
          continue;
        }
      }

      return decorations;
    },
    [editor],
  );

  return decorate;
}

/**
 * Leaf renderer for remote cursor decorations.
 * Wraps text with colored background for selections and renders
 * a caret line + name label for collapsed cursors.
 *
 * IMPORTANT: Must spread `attributes` (contains data-slate-leaf) onto the
 * outermost element so Slate can resolve DOM points back to model points.
 */
export function RemoteCursorLeaf({
  attributes,
  children,
  leaf,
}: {
  attributes: Record<string, unknown>;
  children: React.ReactNode;
  leaf: { remoteCursor?: RemoteCursorDecoration['remoteCursor'] };
}) {
  const cursor = leaf.remoteCursor;
  if (!cursor) return <span {...attributes}>{children}</span>;

  if (cursor.isCollapsed) {
    return (
      <span {...attributes} className="relative">
        <span
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 -ml-px z-10"
          style={{ backgroundColor: cursor.color }}
          contentEditable={false}
        >
          {cursor.name && (
            <span
              className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </span>
          )}
        </span>
        {children}
      </span>
    );
  }

  return (
    <span
      {...attributes}
      style={{ backgroundColor: cursor.color + '40' }}
    >
      {children}
    </span>
  );
}
