import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/App";

describe("App", () => {
  it("renders the product heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /inspect eudi wallet presentation artifacts/i,
      }),
    ).toBeInTheDocument();
  });

  it("links out to the GitHub repository", () => {
    render(<App />);
    const link = screen.getByRole("link", { name: /view on github/i });
    expect(link).toHaveAttribute("href", "https://github.com/Mill1995/eudi-token-inspector");
  });
});
