import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CandidateApplications from "../src/components/candidate/CandidateApplications";
import CandidateProfile from "../src/components/candidate/CandidateProfile";
import { ResumeLibrary } from "../src/components/candidate/ResumeUpload";
import { PipelineContent } from "../src/components/recruiter/Pipeline";
const applications = [{ _id: "a1", job: { _id: "j1", title: "Frontend developer" }, status: "pending", appliedAt: "2026-09-01", candidateProfile: { fullName: "Amara", skills: ["React"], yearsExperience: 2 } }, { _id: "a2", job: { _id: "j2", title: "Graduate engineer" }, status: "reviewed", candidateProfile: { fullName: "Tomi" } }];
function withContext(component, context) { return render(<MemoryRouter><Routes><Route element={<Outlet context={context} />}><Route path="/" element={component} /></Route></Routes></MemoryRouter>); }
describe("Next-screen workflows", () => {
  it("withdraws only after confirmation and reports failures", async () => {
    const cancel = vi.fn().mockResolvedValue({ success: false, message: "Could not withdraw." });
    withContext(<CandidateApplications />, { applications, handleCancelApplication: cancel });
    fireEvent.click(screen.getAllByText("Manage application")[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Withdraw application" })[0]);
    expect(cancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm withdrawal" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not withdraw."));
    expect(cancel).toHaveBeenCalledWith("j1");
  });
  it("does not present missing profile experience as zero years", () => {
    withContext(<CandidateProfile />, { profile: { fullName: "Amara", yearsExperience: null, skills: [] } });
    expect(screen.queryByText("0 years")).not.toBeInTheDocument();
    expect(screen.getByText(/No work experience was extracted/)).toBeInTheDocument();
  });
  it("clears a previously valid file when a new selection is invalid", () => {
    render(<MemoryRouter><ResumeLibrary resumes={[]} onRefresh={vi.fn()} onUpload={vi.fn()} /></MemoryRouter>);
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(["resume"], "resume.pdf", { type: "application/pdf" })] } });
    expect(screen.getByRole("button", { name: "Upload resume" })).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [new File(["bad"], "image.png", { type: "image/png" })] } });
    expect(screen.queryByRole("button", { name: "Upload resume" })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a PDF or DOCX file.");
  });
  it("limits bulk selection to the filtered applicants", async () => {
    const bulk = vi.fn().mockResolvedValue({ success: true });
    render(<PipelineContent applications={applications} onAdvance={vi.fn()} onBulkAdvance={bulk} />);
    fireEvent.click(screen.getByRole("button", { name: /Awaiting review/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select visible applicants" }));
    fireEvent.click(screen.getByRole("button", { name: "Move selected" }));
    await waitFor(() => expect(bulk).toHaveBeenCalledWith(["a1"], "reviewed"));
  });
});
