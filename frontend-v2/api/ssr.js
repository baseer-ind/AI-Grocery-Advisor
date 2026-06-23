import server from "../dist/server/server.js";

// Vercel's Node runtime invokes this as a legacy (req, res) handler: req.url is a
// relative path and req.headers is a plain object, not a Web Request/Headers. Bridge
// it to the Fetch API that the bundled TanStack Start server expects.
export default async function handler(req, res) {
  const host = req.headers.host ?? "localhost";
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const url = new URL(req.url, `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }

  const webResponse = await server.fetch(new Request(url, init), {}, {});

  res.statusCode = webResponse.status;
  for (const [key, value] of webResponse.headers) {
    res.setHeader(key, value);
  }

  if (webResponse.body) {
    const reader = webResponse.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
