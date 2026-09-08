import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import ErrorBoundary from "../src/components/ui/ErrorBoundary";

function Boom() {
  throw new Error("secret stack trace detail");
}

function renderBoom() {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );
  spy.mockRestore();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ErrorBoundary", () => {
  it("shows the raw error message in dev", () => {
    vi.stubEnv("DEV", true);
    renderBoom();
    expect(screen.getByText(/secret stack trace detail/)).toBeInTheDocument();
  });

  it("never shows the raw error message in production", () => {
    vi.stubEnv("DEV", false);
    renderBoom();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText(/secret stack trace detail/)).not.toBeInTheDocument();
    expect(screen.queryByText("Error Message")).not.toBeInTheDocument();
  });
});
