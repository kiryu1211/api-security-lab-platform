import { normalizeDocumentPrefetchRequest } from "./src/lib/prefetch-request";

// @ts-expect-error The OpenNext handler is generated after the standalone type-check.
import openNextHandler from "./.open-next/worker.js";

const worker = {
  fetch(request: Request, env: unknown, context: unknown) {
    return openNextHandler.fetch(
      normalizeDocumentPrefetchRequest(request),
      env,
      context,
    );
  },
};

export default worker;
