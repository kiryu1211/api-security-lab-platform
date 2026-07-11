import { z } from "zod";

const labModeSchema = z.enum(["local", "disabled"]).default("disabled");

export type LabMode = z.infer<typeof labModeSchema>;

export type LabRuntimeSafety = {
  labMode: LabMode;
  nodeEnv: string;
  vulnerableApisEnabled: boolean;
};

type LabEnvironment = {
  LAB_MODE?: string;
  NODE_ENV?: string;
};

export function getLabMode(value?: string): LabMode {
  const result = labModeSchema.safeParse(value || undefined);

  return result.success ? result.data : "disabled";
}

export function getLabRuntimeSafety(
  env: LabEnvironment = process.env,
): LabRuntimeSafety {
  const labMode = getLabMode(env.LAB_MODE);
  const nodeEnv = env.NODE_ENV || "";

  return {
    labMode,
    nodeEnv,
    vulnerableApisEnabled:
      labMode === "local" && (nodeEnv === "development" || nodeEnv === "test"),
  };
}

export function assertVulnerableApisEnabled(
  request?: Request,
  env: LabEnvironment = process.env,
) {
  const safety = getLabRuntimeSafety(env);
  const requestIsLoopback = isLoopbackRequest(request);
  const publicSafety = {
    vulnerableApisEnabled: safety.vulnerableApisEnabled && requestIsLoopback,
  };

  if (!publicSafety.vulnerableApisEnabled) {
    return {
      ok: false as const,
      status: 403,
      message:
        "Vulnerable APIs require LAB_MODE=local, NODE_ENV=development or test, and a loopback request.",
      safety: publicSafety,
    };
  }

  return { ok: true as const, safety: publicSafety };
}

function isLoopbackRequest(request?: Request): boolean {
  if (!(request instanceof Request)) {
    return false;
  }

  const urlHostname = new URL(request.url).hostname;
  const hostHeader = request.headers.get("host");

  return (
    isLoopbackHostname(urlHostname) &&
    (hostHeader === null || isLoopbackHostHeader(hostHeader))
  );
}

function isLoopbackHostHeader(host: string): boolean {
  return (
    /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host) ||
    /^\[::1\](?::\d+)?$/i.test(host) ||
    host.toLowerCase() === "::1"
  );
}

function isLoopbackHostname(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    hostname.toLowerCase(),
  );
}
