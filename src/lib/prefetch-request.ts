export function normalizeDocumentPrefetchRequest(request: Request) {
  const nextRouterPrefetch = request.headers.has("next-router-prefetch");
  const purposePrefetch =
    request.headers.get("purpose")?.toLowerCase() === "prefetch";

  if (!nextRouterPrefetch && !purposePrefetch) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.delete("next-router-prefetch");
  if (purposePrefetch) {
    headers.delete("purpose");
  }

  return new Request(request, { headers });
}
