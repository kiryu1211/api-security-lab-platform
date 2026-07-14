import type { LearningModuleId } from "./learning-modules";

export type ShowcaseDemoResult = {
  status: number;
  body: unknown;
};

export type ShowcaseModuleResults = {
  vulnerable: ShowcaseDemoResult;
  secure: ShowcaseDemoResult;
};

const vulnerableMeta = {
  routeType: "vulnerable",
  localOnly: true,
  synthetic: true,
  source: "public-showcase",
} as const;
const secureMeta = {
  routeType: "secure",
  synthetic: true,
  source: "public-showcase",
} as const;

export const showcaseResults = {
  bola: {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: ownership checks were intentionally skipped.",
          order: {
            id: "order-demo-002",
            ownerId: "user-demo-bob",
            resourceType: "order",
            data: {
              itemLabel: "lab-verification-plan",
              amount: 1800,
              status: "review",
            },
          },
          owner: {
            id: "user-demo-bob",
            displayName: "Demo User B",
            role: "learner",
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "The authenticated demo user does not own the requested order.",
        },
        meta: secureMeta,
      },
    },
  },
  auth: {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: token identity was accepted without secure validation.",
          subjectUserId: "user-demo-bob",
          permissions: ["orders:read", "admin:read"],
          acceptedChecks: ["token-id-present"],
          tokenDiagnostics: {
            tokenId: "demo-token-expired-admin",
            signatureState: "invalid",
            expired: true,
            revoked: true,
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 401,
      body: {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "The demo token failed secure validation.",
          details: { reason: "invalid-signature" },
        },
        meta: secureMeta,
      },
    },
  },
  "mass-assignment": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: every accepted property was applied directly.",
          profile: {
            id: "profile-demo-001",
            ownerId: "user-demo-bob",
            resourceType: "profile",
            data: {
              displayLabel: "changed-label",
              notificationsEnabled: true,
              roleEditableByUser: false,
              role: "reviewer",
              ownerId: "user-demo-bob",
            },
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Profile update contains properties that are not allowed for normal user updates.",
          details: {
            rejectedProperties: ["ownerId", "role"],
            allowedProperties: ["displayLabel", "notificationsEnabled"],
          },
        },
        meta: secureMeta,
      },
    },
  },
  "rate-limit": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: no request limiting was applied.",
          result: {
            userId: "user-demo-alice",
            query: "demo",
            limitApplied: false,
            resultLabel: "unlimited-result-for-demo",
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 429,
      body: {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "The demo rate limit has been exceeded.",
          details: { allowed: false, limit: 3, remaining: 0 },
        },
        meta: secureMeta,
      },
    },
  },
  "function-auth": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: an administrative action was accepted without feature-level permission checks.",
          invitation: {
            accepted: true,
            actorUserId: "user-demo-alice",
            actorRole: "learner",
            feature: "admin:invitations:create",
            invitation: {
              invitationId: "invite-demo-analyst-demo",
              targetEmailAlias: "analyst.demo",
              requestedRole: "admin",
              emailSent: false,
              accountCreated: false,
            },
            checks: {
              actorAuthenticated: true,
              functionPermissionChecked: false,
              roleEscalationChecked: false,
              denyByDefaultApplied: false,
            },
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Administrative function request was rejected by feature-level authorization.",
          details: {
            allowed: false,
            reason: "missing-feature-permission",
            actorUserId: "user-demo-alice",
            actorRole: "learner",
            requiredPermission: "admin:invitations:create",
          },
        },
        meta: secureMeta,
      },
    },
  },
  "business-flow": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: an excessive direct reservation was accepted.",
          reservation: {
            accepted: true,
            productId: "product-demo-001",
            productLabel: "limited-api-lab-ticket",
            userId: "user-demo-alice",
            requestedQuantity: 4,
            reservedQuantity: 4,
            flowStep: "direct-checkout",
            checks: {
              flowOrderChecked: false,
              perUserLimitChecked: false,
              stockCheckedBeforeReservation: false,
              automationPatternChecked: false,
            },
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Sensitive business flow request was rejected by flow and abuse controls.",
          details: {
            allowed: false,
            reason: "flow-order-violation",
            userId: "user-demo-alice",
            productId: "product-demo-001",
            requiredStep: "cart-confirmed",
            receivedStep: "direct-checkout",
          },
        },
        meta: secureMeta,
      },
    },
  },
  ssrf: {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: an arbitrary private URL was accepted, but no network request was performed.",
          preview: {
            accepted: true,
            wouldFetch: "http://127.0.0.1/admin",
            networkAccessPerformed: false,
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "The requested URL is not allowed by the SSRF protection policy.",
          details: {
            allowed: false,
            reason: "private-host-rejected",
            networkAccessPerformed: false,
          },
        },
        meta: secureMeta,
      },
    },
  },
  "security-config": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: demo debug configuration and permissive policy metadata were exposed.",
          diagnostics: {
            accepted: true,
            auditScenario: {
              requestedOrigin: "https://untrusted.example",
              usedForAuthorization: false,
            },
            exposedConfiguration: {
              serviceName: "api-security-lab-demo",
              environmentLabel: "local-demo",
              debugMode: true,
              stackTraceEnabled: true,
              corsPolicy: "reflect-requested-origin-with-credentials",
              syntheticStackTrace:
                "DemoError: synthetic configuration failure at demo-handler.ts:42",
            },
            responsePolicy: {
              syntheticCredentialsAllowed: true,
              platformBaselineHeadersApplied: true,
              diagnosticExposureControlsApplied: false,
              cacheDisabled: true,
              verboseErrorsReturned: true,
            },
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 200,
      body: {
        ok: true,
        data: {
          diagnostics: {
            auditScenario: {
              requestedOrigin: "https://untrusted.example",
              usedForAuthorization: false,
            },
            publicConfiguration: {
              serviceName: "api-security-lab-demo",
              environmentLabel: "local-demo",
              debugMode: false,
              stackTraceEnabled: false,
            },
            controls: {
              requestOriginChecked: true,
              originHeaderPresent: false,
              debugDetailsSuppressed: true,
              securityHeadersApplied: true,
              cacheDisabled: true,
              verboseErrorsReturned: false,
            },
          },
        },
        meta: secureMeta,
      },
    },
  },
  "api-inventory": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: a retired API operation was invoked without lifecycle checks.",
          operation: {
            invoked: true,
            endpointId: "legacy-token-reset-v1",
            requestedEnvironment: "production",
            inventoryKnown: true,
            endpointState: "retired",
            version: "v1",
            syntheticOperation: {
              tokenResetPreviewCreated: true,
              realTokenIssued: false,
              realNotificationSent: false,
            },
            checks: {
              lifecycleChecked: false,
              ownerChecked: false,
              documentationFreshnessChecked: false,
              exposureReviewed: false,
              protectionParityChecked: false,
            },
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "API operation was rejected by inventory and lifecycle controls.",
          details: {
            allowed: false,
            reason: "endpoint-not-active",
            endpointId: "legacy-token-reset-v1",
            lifecycle: "retired",
            version: "v1",
          },
        },
        meta: secureMeta,
      },
    },
  },
  "unsafe-consumption": {
    vulnerable: {
      status: 200,
      body: {
        ok: true,
        data: {
          warning:
            "Synthetic showcase result: partner API data was trusted without validation.",
          importResult: {
            imported: true,
            providerResponseId: "partner-response-redirect-admin",
            trustedProviderWithoutVerification: "trusted-profile-service",
            acceptedRedirectTo: "https://attacker.example.test/collect-profile",
            importedProfile: {
              displayLabel: "alice-from-compromised-partner",
              profileTier: "premium",
              role: "admin",
              externalNotes: "synthetic-compromised-response",
            },
            checks: {
              providerMatched: false,
              transportChecked: false,
              redirectAllowlistChecked: false,
              responseSchemaChecked: false,
              privilegedFieldsRejected: false,
            },
          },
        },
        meta: vulnerableMeta,
      },
    },
    secure: {
      status: 403,
      body: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Third-party API response was rejected by trust-boundary controls.",
          details: {
            allowed: false,
            reason: "redirect-origin-not-allowed",
            redirectTo: "https://attacker.example.test/collect-profile",
            allowedRedirectOrigin: "https://profile-api.example.test",
          },
        },
        meta: secureMeta,
      },
    },
  },
} satisfies Record<LearningModuleId, ShowcaseModuleResults>;
