import express from "express";
import { createServer } from "http";
import { brotliCompressSync, constants, gzipSync } from "zlib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function sendCompressedFile(req: express.Request, res: express.Response, candidate: string) {
  const extension = path.extname(candidate).toLowerCase();
  if (!contentTypes[extension]) return false;

  let file: fs.Stats;
  try {
    file = fs.statSync(candidate);
  } catch {
    return false;
  }
  if (!file.isFile()) return false;

  const source = fs.readFileSync(candidate);
  const acceptEncoding = String(req.headers["accept-encoding"] ?? "");
  let body: Buffer = source;
  let encoding: "br" | "gzip" | undefined;
  if (acceptEncoding.includes("br")) {
    body = brotliCompressSync(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
    encoding = "br";
  } else if (acceptEncoding.includes("gzip")) {
    body = gzipSync(source, { level: 6 });
    encoding = "gzip";
  }

  const headers: Record<string, string> = {
    "Content-Type": contentTypes[extension],
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    "Vary": "Accept-Encoding",
    "ETag": `W/\"${file.size.toString(16)}-${Math.floor(file.mtimeMs).toString(16)}\"`,
  };
  if (encoding) headers["Content-Encoding"] = encoding;
  res.set(headers);
  if (req.method === "HEAD") res.status(200).end();
  else res.status(200).send(body);
  return true;
}

function createCompressedStaticMiddleware(staticPath: string) {
  const compressibleExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt", ".xml"]);
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const pathname = decodeURIComponent(req.path);
    const candidate = path.resolve(staticPath, `.${pathname}`);
    if (!candidate.startsWith(`${staticPath}${path.sep}`)) return next();
    if (!compressibleExtensions.has(path.extname(candidate).toLowerCase())) return next();
    return sendCompressedFile(req, res, candidate) ? undefined : next();
  };
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const staticPath = process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  app.use(createCompressedStaticMiddleware(staticPath));
  app.use(express.static(staticPath, { index: false, setHeaders: (res, filePath) => {
    if (path.extname(filePath) !== ".html") res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }}));

  app.get("*", (req, res) => {
    if (!sendCompressedFile(req, res, path.join(staticPath, "index.html"))) {
      res.status(404).send("Not found");
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
