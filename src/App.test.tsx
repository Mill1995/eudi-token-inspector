import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("copies the decoded view to the clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "good-issuance" }));
    fireEvent.click(await screen.findByRole("button", { name: /copy the decoded view/i }));
    expect(writeText).toHaveBeenCalled();
  });

  it("shows an informational issuer-trust result for a snapshot issuer", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "good-issuance" }));
    expect(await screen.findByText("EUDI Inspector reference issuer")).toBeInTheDocument();
    expect(screen.getByText("Trusted")).toBeInTheDocument();
    expect(screen.getByText(/not an authoritative trust decision/i)).toBeInTheDocument();
  });

  it("renders requested claims and fires the overasking rules for the DCQL request", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "overasking-request-dcql" }));
    expect(await screen.findByText(/3 rules fired/i)).toBeInTheDocument();
    expect(screen.getAllByText("document_number").length).toBeGreaterThan(0);
    expect(screen.getByText(/facial portrait is biometric data/i)).toBeInTheDocument();
  });

  it("shows no overasking for the justified PEX baseline request", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "request-pex" }));
    expect(await screen.findByText("age_over_18")).toBeInTheDocument();
    expect(screen.getByText(/no overasking rules fired/i)).toBeInTheDocument();
  });

  it("re-evaluates when a rule is toggled off", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "overasking-request-dcql" }));
    expect(await screen.findByText(/3 rules fired/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /portrait requested in a remote flow/i }));
    expect(await screen.findByText(/2 rules fired/i)).toBeInTheDocument();
  });
});
