import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDeleteMyAccount = vi.fn();
vi.mock("../src/lib/api", () => ({
  deleteMyAccount: (...args) => mockDeleteMyAccount(...args),
}));

const mockLogout = vi.fn();
vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: { fullName: "Jane Doe", email: "jane@example.com", role: "candidate" }, token: "tok-123", logout: mockLogout }),
}));

vi.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

import Nav from "../src/components/layout/Nav";

beforeEach(() => {
  mockDeleteMyAccount.mockReset();
  mockLogout.mockReset();
});

function clickDeleteAccountButton() {
  // "Delete account" labels both the account-menu button and (once the
  // dialog is open) the dialog's own confirm button — always click the
  // last one rendered, same convention AuthPage.test.jsx uses for its
  // duplicate-label tab/submit buttons.
  const buttons = screen.getAllByRole("button", { name: "Delete account" });
  fireEvent.click(buttons[buttons.length - 1]);
}

function openDeleteDialog() {
  render(<Nav />);
  fireEvent.click(screen.getByText("Account"));
  clickDeleteAccountButton();
}

describe("Nav — account deletion", () => {
  it("signs the user out after a successful deletion", async () => {
    mockDeleteMyAccount.mockResolvedValue({ success: true });
    openDeleteDialog();

    clickDeleteAccountButton();

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    expect(mockDeleteMyAccount).toHaveBeenCalledWith("tok-123");
  });

  it("shows an error and does not sign out when deletion fails", async () => {
    mockDeleteMyAccount.mockResolvedValue({ success: false, message: "Could not delete your account. Please try again." });
    openDeleteDialog();

    clickDeleteAccountButton();

    await waitFor(() => expect(screen.getByText(/could not delete your account/i)).toBeInTheDocument());
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
