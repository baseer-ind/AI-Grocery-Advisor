import server from "../dist/server/server.js";

export default function handler(request) {
  // Vercel's Node runtime passes a Request with a relative .url (e.g. "/dashboard"),
  // but the bundled server requires an absolute URL to construct its internal request object.
  const host = request.headers.get("host") ?? "localhost";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const absoluteUrl = new URL(request.url, `${proto}://${host}`);
  const normalizedRequest = new Request(absoluteUrl, request);
  return server.fetch(normalizedRequest, {}, {});
}
