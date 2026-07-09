import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/App";

describe("App", () => {
  it("renders the product heading and GitHub link", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /inspect eudi wallet presentation artifacts/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/Mill1995/eudi-token-inspector",
    );
  });

  it("shows the empty state before an artifact is pasted", () => {
    render(<App />);
    expect(screen.getByText(/paste an artifact or load an example/i)).toBeInTheDocument();
  });

  it("verifies the good-presentation example to six passing checks", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "good-presentation" }));
    expect(await screen.findAllByText("Pass")).toHaveLength(6);
    expect(await screen.findByText('"Ada"')).toBeInTheDocument();
  });

  it("flags a failing check for the wrong-aud example", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "bad-wrong-aud" }));
    expect(await screen.findByText("Fail")).toBeInTheDocument();
  });
});
