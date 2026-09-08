import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import ForgotPasswordPage from "../src/pages/ForgotPasswordPage";
import ResetPasswordPage from "../src/pages/ResetPasswordPage";
import VerifyEmailPage from "../src/pages/VerifyEmailPage";
it("keeps password recovery responses account-neutral", async () => {
  const request = vi.fn().mockResolvedValue({ success: true });
  render(<MemoryRouter><ForgotPasswordPage onRequest={request} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  await waitFor(() => expect(screen.getByText(/If this email is registered/)).toBeInTheDocument());
  expect(request).toHaveBeenCalledWith("person@example.com");
});
it("blocks mismatched passwords and waits for user navigation after success", async () => {
  const reset = vi.fn().mockResolvedValue({ success: true });
  render(<MemoryRouter initialEntries={["/reset-password?token=test"]}><ResetPasswordPage onReset={reset} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "password123" } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different123" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(reset).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent(/don’t match/);
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue to sign in" })).toBeInTheDocument());
  expect(reset).toHaveBeenCalledWith("test", "password123");
});
it("offers verification recovery when the link has no token", () => {
  const verify = vi.fn();
  render(<MemoryRouter><VerifyEmailPage onVerify={verify} /></MemoryRouter>);
  expect(verify).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Email address")).toBeRequired();
  expect(screen.getByRole("button", { name: "Send a new verification link" })).toBeInTheDocument();
});
