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

  it("renders synthetic post-run results without making an API request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<HomePage publicShowcase />);

    expect(screen.getByText("公開ショーケース")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "合成結果を表示" }));

    const resultBoxes = container.querySelectorAll(
      '.api-result-box[data-has-result="true"]',
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(resultBoxes).toHaveLength(2);
    expect(resultBoxes[0].textContent).toContain("脆弱APIの合成結果");
    expect(resultBoxes[0].textContent).toContain("HTTP 200");
    expect(resultBoxes[0].textContent).toContain("order-demo-002");
    expect(resultBoxes[0].textContent).toContain('"synthetic": true');
    expect(resultBoxes[1].textContent).toContain("安全APIの合成結果");
    expect(resultBoxes[1].textContent).toContain("HTTP 403");
    expect(resultBoxes[1].textContent).toContain("FORBIDDEN");
  });

  it("switches the public action and notice completely to English", () => {
    render(<HomePage publicShowcase />);

    fireEvent.click(screen.getByRole("button", { name: "英語" }));

    expect(
      screen.getByRole("button", { name: "Show synthetic results" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /displays synthetic results without making a network request/,
      ),
    ).toBeTruthy();
  });
});
