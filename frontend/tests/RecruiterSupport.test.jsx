import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { JobForm } from "../src/components/recruiter/PostJobView";
import { SupportForm } from "../src/components/contact/ContactSupport";
it("publishes trimmed requirements using the existing payload", async () => {
  const create = vi.fn().mockResolvedValue({ success: true });
  render(<JobForm onCreate={create} />);
  fireEvent.change(screen.getByLabelText("Job title *"), { target: { value: " Frontend developer " } });
  fireEvent.change(screen.getByLabelText("Description *"), { target: { value: " Build accessible interfaces. " } });
  fireEvent.change(screen.getByLabelText(/Required skills/), { target: { value: " React, CSS, " } });
  fireEvent.click(screen.getByRole("button", { name: "Publish role" }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: "Frontend developer", description: "Build accessible interfaces.", requiredSkills: ["React", "CSS"], requiredExperienceYears: 0 })));
});
it("keeps support message content after a failed send", async () => {
  const send = vi.fn().mockResolvedValue({ success: false, message: "Please try again." });
  render(<SupportForm user={{ fullName: "Amara", email: "amara@example.com" }} onSend={send} />);
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "My resume needs review." } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Please try again."));
  expect(screen.getByLabelText("Message")).toHaveValue("My resume needs review.");
});

it("uses standard matching without sending custom weights", async () => {
  const { matchingWeights } = await import("../src/components/recruiter/PostJobView");
  expect(matchingWeights("default")).toBeUndefined();
  for (const mode of ["skills", "experience"]) {
    expect(Object.values(matchingWeights(mode)).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  }
});
it("sends the skills focus preset without manual calculations", async () => {
  const create = vi.fn().mockResolvedValue({ success: true });
  render(<JobForm onCreate={create} />);
  fireEvent.change(screen.getByLabelText("Job title *"), { target: { value: "Office assistant" } });
  fireEvent.change(screen.getByLabelText("Description *"), { target: { value: "Support daily office operations." } });
  fireEvent.change(screen.getByLabelText(/What matters most/), { target: { value: "skills" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish role" }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ weights: { skills: .6, experience: .15, semantic: .2, education: .05 } })));
});
