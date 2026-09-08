import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

const mockAuthLogin = vi.fn();
const mockAuthRegister = vi.fn();
const mockResendVerification = vi.fn();

vi.mock("../src/lib/api", () => ({
  authLogin: (...args) => mockAuthLogin(...args),
  authRegister: (...args) => mockAuthRegister(...args),
  resendVerification: (...args) => mockResendVerification(...args),
}));

import AuthPage from "../src/pages/AuthPage";

function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockAuthLogin.mockReset();
  mockAuthRegister.mockReset();
  mockResendVerification.mockReset();
});

describe("AuthPage — email verification gating (Phase 3)", () => {
  it("shows the resend-verification link when login is blocked for an unverified account", async () => {
    mockAuthLogin.mockResolvedValue({
      success: false,
      message: "Please verify your email before logging in.",
      data: { needsVerification: true },
    });

    renderAuthPage();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    // "Sign in" labels both the (already-active) tab button and the submit
    // button — the submit button is rendered second (form comes after the tab switcher).
    const signInButtons = screen.getAllByRole("button", { name: "Sign in" });
    fireEvent.click(signInButtons[signInButtons.length - 1]);

    await waitFor(() => expect(screen.getByText("Resend verification email")).toBeInTheDocument());
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
  });

  it("does NOT show the resend link for a plain wrong-password failure", async () => {
    mockAuthLogin.mockResolvedValue({ success: false, message: "Invalid email or password.", data: null });

    renderAuthPage();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong" } });
    // "Sign in" labels both the (already-active) tab button and the submit
    // button — the submit button is rendered second (form comes after the tab switcher).
    const signInButtons = screen.getAllByRole("button", { name: "Sign in" });
    fireEvent.click(signInButtons[signInButtons.length - 1]);

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
    expect(screen.queryByText("Resend verification email")).not.toBeInTheDocument();
  });

  it("after registering, switches to the login tab and shows the resend option instead of auto-login (Phase 3)", async () => {
    mockAuthRegister.mockResolvedValue({
      success: true,
      message: "Registration successful. Please check your email to verify your account before logging in.",
      data: { needsVerification: true, email: "newuser@example.com" },
    });

    renderAuthPage();
    // Before switching tabs, only the tab-switcher button has this label.
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "newuser@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    // Now both the tab button and the submit button share this label — the
    // submit button is the second one rendered (form comes after the tab switcher).
    const createAccountButtons = screen.getAllByRole("button", { name: "Create account" });
    fireEvent.click(createAccountButtons[createAccountButtons.length - 1]);

    await waitFor(() => expect(screen.getByText(/check your email to verify/i)).toBeInTheDocument());
    // Landed back on the login tab with the resend option available.
    expect(screen.getByText("Resend verification email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });
});

it("registers the selected recruiter intent and allows password visibility", async () => {
  mockAuthRegister.mockResolvedValue({ success: true, message: "Verify your email.", data: { needsVerification: true } });
  renderAuthPage();
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  fireEvent.click(screen.getByRole("button", { name: /Hire people/ }));
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Hiring Lead" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "lead@example.com" } });
  const password = screen.getByLabelText(/PasswordAt least/);
  fireEvent.change(password, { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(password).toHaveAttribute("type", "text");
  fireEvent.submit(password.closest("form"));
  await waitFor(() => expect(mockAuthRegister).toHaveBeenCalledWith({ fullName: "Hiring Lead", email: "lead@example.com", password: "password123", role: "recruiter" }));
});
