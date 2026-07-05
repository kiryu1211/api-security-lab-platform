import { z } from "zod";

const labModeSchema = z.enum(["local", "disabled"]).default("local");

export type LabMode = z.infer<typeof labModeSchema>;

export type LabRuntimeSafety = {
  labMode: LabMode;
  nodeEnv: string;
  vulnerableApisEnabled: boolean;
};

export function getLabMode(value = process.env.LAB_MODE): LabMode {
  return labModeSchema.parse(value || undefined);
}

export function getLabRuntimeSafety(
  env: NodeJS.ProcessEnv = process.env,
): LabRuntimeSafety {
  const labMode = getLabMode(env.LAB_MODE);
  const nodeEnv = env.NODE_ENV || "development";

  return {
    labMode,
    nodeEnv,
    vulnerableApisEnabled: labMode === "local" && nodeEnv !== "production",
  };
}

export function assertVulnerableApisEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  const safety = getLabRuntimeSafety(env);

  if (!safety.vulnerableApisEnabled) {
    return {
      ok: false as const,
      status: 403,
      message:
        "Vulnerable APIs are disabled unless LAB_MODE=local and NODE_ENV is not production.",
      safety,
    };
  }

  return { ok: true as const, safety };
}
