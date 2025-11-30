import { serve, file } from "bun";
import { join } from "path";

const PORT = parseInt(process.env.PORT || "3000");
const DIST_DIR = process.env.DIST_DIR || "./dist";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."));
  return mimeTypes[ext] || "application/octet-stream";
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index.html for root
    if (pathname === "/") {
      pathname = "/index.html";
    }

    const filePath = join(DIST_DIR, pathname);

    try {
      const f = file(filePath);
      if (await f.exists()) {
        return new Response(f, {
          headers: {
            "Content-Type": getMimeType(pathname),
            // Cache static assets
            ...(pathname !== "/index.html" && {
              "Cache-Control": "public, max-age=31536000, immutable",
            }),
          },
        });
      }
    } catch {
      // File not found, fall through to SPA handler
    }

    // SPA fallback - serve index.html for all routes
    const indexFile = file(join(DIST_DIR, "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Ponix Web UI running on http://0.0.0.0:${PORT}`);
