// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  learningModules,
  type LearningModuleId,
} from "@/data/learning-modules";
import { HomePage } from "./home-page";

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  window.sessionStorage.setItem("api-security-lab-opening-seen", "seen");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

type ExpectedRequest = {
  url: string;
  method: "GET" | "PATCH" | "POST";
  body?: Record<string, unknown>;
};

function jsonPair(
  vulnerableUrl: string,
  secureUrl: string,
  method: "PATCH" | "POST",
  body: Record<string, unknown>,
): ExpectedRequest[] {
  return [
    { url: vulnerableUrl, method, body },
    { url: secureUrl, method, body },
  ];
}

const localDemoCases: Array<{
  moduleId: LearningModuleId;
  requests: ExpectedRequest[];
}> = [
  {
    moduleId: "bola",
    requests: [
      {
        url: "/api/vulnerable/orders/order-demo-002",
        method: "GET",
      },
      {
        url: "/api/secure/orders/order-demo-002?userId=user-demo-alice",
        method: "GET",
      },
    ],
  },
  {
    moduleId: "auth",
    requests: jsonPair(
      "/api/vulnerable/auth/session",
      "/api/secure/auth/session",
      "POST",
      {
        tokenId: "demo-token-expired-admin",
        requiredPermission: "admin:read",
      },
    ),
  },
  {
    moduleId: "mass-assignment",
    requests: jsonPair(
      "/api/vulnerable/profile",
      "/api/secure/profile",
      "PATCH",
      {
        displayLabel: "changed-label",
        ownerId: "user-demo-bob",
        role: "reviewer",
      },
    ),
  },
  {
    moduleId: "rate-limit",
    requests: [
      {
        url: "/api/vulnerable/rate-limit/search?userId=user-demo-alice&q=demo",
        method: "GET",
      },
      ...Array.from({ length: 4 }, () => ({
        url: "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
        method: "GET" as const,
      })),
    ],
  },
  {
    moduleId: "function-auth",
    requests: jsonPair(
      "/api/vulnerable/admin/invitations",
      "/api/secure/admin/invitations",
      "POST",
      {
        actorUserId: "user-demo-alice",
        targetEmailAlias: "analyst.demo",
        requestedRole: "admin",
      },
    ),
  },
  {
    moduleId: "business-flow",
    requests: jsonPair(
      "/api/vulnerable/business-flow/reservations",
      "/api/secure/business-flow/reservations",
      "POST",
      {
        userId: "user-demo-alice",
        productId: "product-demo-001",
        quantity: 4,
        flowStep: "direct-checkout",
      },
    ),
  },
  {
    moduleId: "ssrf",
    requests: [
      {
        url: "/api/vulnerable/fetch-url",
        method: "POST",
        body: { url: "http://127.0.0.1/admin" },
      },
      {
        url: "/api/secure/fetch-url",
        method: "POST",
        body: { url: "https://127.0.0.1/admin" },
      },
    ],
  },
  {
    moduleId: "security-config",
    requests: jsonPair(
      "/api/vulnerable/config/diagnostics",
      "/api/secure/config/diagnostics",
      "POST",
      {
        requestedOrigin: "https://untrusted.example",
        includeDebugDetails: true,
      },
    ),
  },
  {
    moduleId: "api-inventory",
    requests: jsonPair(
      "/api/vulnerable/inventory/operations",
      "/api/secure/inventory/operations",
      "POST",
      {
        endpointId: "legacy-token-reset-v1",
        requestedEnvironment: "production",
      },
    ),
  },
  {
    moduleId: "unsafe-consumption",
    requests: jsonPair(
      "/api/vulnerable/third-party/profile-import",
      "/api/secure/third-party/profile-import",
      "POST",
      {
        providerResponseId: "partner-response-redirect-admin",
        expectedProvider: "trusted-profile-service",
      },
    ),
  },
];

describe("HomePage public showcase", () => {
  it("places the public request-results control after the API examples", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<HomePage publicShowcase />);

    expect(screen.getByText("公開ショーケース")).toBeTruthy();
    expect(container.querySelector("[style]")).toBeNull();
    const comparisonGrid = container.querySelector(".comparison-grid");
    const actionRow = container.querySelector(".demo-action-row");

    expect(comparisonGrid).toBeTruthy();
    expect(actionRow).toBeTruthy();
    expect(
      comparisonGrid!.compareDocumentPosition(actionRow!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "リクエスト結果を表示" }),
    );

    const resultBoxes = container.querySelectorAll(
      '.api-result-box[data-has-result="true"]',
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(resultBoxes).toHaveLength(2);
    expect(resultBoxes[0].textContent).toContain("脆弱APIのリクエスト結果");
    expect(resultBoxes[0].textContent).toContain("HTTP 200");
    expect(resultBoxes[0].textContent).toContain("order-demo-002");
    expect(resultBoxes[0].textContent).toContain('"synthetic": true');
    expect(resultBoxes[1].textContent).toContain("安全APIのリクエスト結果");
    expect(resultBoxes[1].textContent).toContain("HTTP 403");
    expect(resultBoxes[1].textContent).toContain("FORBIDDEN");
  });

  it("switches the public action and notice completely to English", () => {
    render(<HomePage publicShowcase />);

    fireEvent.click(screen.getByRole("button", { name: "英語" }));

    expect(
      screen.getByRole("button", { name: "Show request results" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /displays representative request results without sending an API request/,
      ),
    ).toBeTruthy();
  });

  it("restores persisted language and theme preferences", () => {
    window.localStorage.setItem("lab-ui-language", "en");
    window.localStorage.setItem("lab-ui-theme", "dark");

    render(<HomePage publicShowcase />);

    expect(
      screen.getByRole("button", { name: "Show request results" }),
    ).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("switches themes without creating inline style attributes", () => {
    const { container } = render(<HomePage publicShowcase />);

    fireEvent.click(screen.getByRole("button", { name: "ダークテーマ" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.hasAttribute("style")).toBe(false);
    expect(container.querySelector("[style]")).toBeNull();
  });
});

describe("HomePage local API demos", () => {
  it("sends the documented method, URL, and body for every learning topic", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    render(<HomePage />);

    for (const { moduleId, requests } of localDemoCases) {
      const learningModule = learningModules.find(
        (candidate) => candidate.id === moduleId,
      );
      expect(learningModule).toBeTruthy();
      const callOffset = fetchMock.mock.calls.length;

      fireEvent.click(
        screen.getByRole("button", {
          name: (name) => name.includes(learningModule!.title.ja),
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: "APIデモを実行" }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(callOffset + requests.length);
        expect(
          (
            screen.getByRole("button", {
              name: "APIデモを実行",
            }) as HTMLButtonElement
          ).disabled,
        ).toBe(false);
      });

      const actualCalls = fetchMock.mock.calls.slice(callOffset);
      requests.forEach((expectedRequest, index) => {
        const [input, init] = actualCalls[index];
        expect(String(input)).toBe(expectedRequest.url);
        expect(init?.method ?? "GET").toBe(expectedRequest.method);

        if (expectedRequest.body) {
          expect(init?.headers).toEqual({
            "Content-Type": "application/json",
          });
          expect(JSON.parse(String(init?.body))).toEqual(expectedRequest.body);
        } else {
          expect(init?.body).toBeUndefined();
        }
      });
    }
  });

  it("clears the running state and shows the Japanese error after a network failure", async () => {
    let rejectRequest: ((reason?: unknown) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((_, reject) => {
          rejectRequest ??= reject;
        }),
    );
    const { container } = render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "APIデモを実行" }));

    expect(
      (
        screen.getByRole("button", {
          name: "APIを実行しています...",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      container.querySelector(".demo-action-row")?.getAttribute("aria-busy"),
    ).toBe("true");

    await act(async () => {
      rejectRequest?.(new Error("synthetic network failure"));
    });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "APIデモを完了できませんでした。ローカルサーバーの状態を確認して、もう一度実行してください。",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "APIデモを実行",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(
      container.querySelector(".demo-action-row")?.getAttribute("aria-busy"),
    ).toBe("false");
  });

  it("clears the running state and shows the English error after invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response("{", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const { container } = render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "英語" }));
    fireEvent.click(screen.getByRole("button", { name: "Run API demo" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "The API demo could not be completed. Check the local server and try again.",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Run API demo",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(
      container.querySelector(".demo-action-row")?.getAttribute("aria-busy"),
    ).toBe("false");
  });
});
