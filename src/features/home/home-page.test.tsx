// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./home-page";

describe("HomePage public showcase", () => {
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
