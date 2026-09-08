import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResumeLibrary } from "../src/components/candidate/ResumeUpload";

function pdfFile(name = "resume.pdf", sizeBytes = 1024) {
  const file = new File([new Uint8Array(sizeBytes)], name, { type: "application/pdf" });
  return file;
}

function renderLibrary(props = {}) {
  const defaults = {
    resumes: [],
    onRefresh: vi.fn(),
    onUpload: vi.fn(),
    onDefault: vi.fn(),
    onDelete: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <ResumeLibrary {...defaults} {...props} />
    </MemoryRouter>
  );
}

function chooseFile(file) {
  const input = document.getElementById("resume-file");
  fireEvent.change(input, { target: { files: [file] } });
}

describe("ResumeUpload — upload success/failure", () => {
  it("uploads the selected file and shows a success message, then updates the library list", async () => {
    const onUpload = vi.fn().mockResolvedValue({ success: true });
    renderLibrary({ onUpload });

    chooseFile(pdfFile());
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

    await waitFor(() => expect(screen.getByText(/resume uploaded/i)).toBeInTheDocument());
    expect(onUpload).toHaveBeenCalledTimes(1);
    const uploadedFile = onUpload.mock.calls[0][0];
    expect(uploadedFile.name).toBe("resume.pdf");
  });

  it("shows an error and keeps the selected file when the upload fails", async () => {
    const onUpload = vi.fn().mockResolvedValue({ success: false, message: "Upload failed. Try again." });
    renderLibrary({ onUpload });

    chooseFile(pdfFile());
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

    await waitFor(() => expect(screen.getByText("Upload failed. Try again.")).toBeInTheDocument());
    // The file stays selected on failure — the user shouldn't have to re-pick it to retry.
    expect(screen.getByRole("button", { name: "Upload resume" })).toBeInTheDocument();
  });

  it("rejects a non-PDF/DOCX file before ever calling onUpload", () => {
    const onUpload = vi.fn();
    renderLibrary({ onUpload });

    chooseFile(new File(["x"], "resume.txt", { type: "text/plain" }));

    expect(screen.getByText("Choose a PDF or DOCX file.")).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("rejects a file over the 5MB limit before ever calling onUpload", () => {
    const onUpload = vi.fn();
    renderLibrary({ onUpload });

    chooseFile(pdfFile("big.pdf", 6 * 1024 * 1024));

    expect(screen.getByText("Choose a file smaller than 5 MB.")).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("disables the upload zone once 5 resumes are already in the library", () => {
    const resumes = Array.from({ length: 5 }, (_, i) => ({ _id: `r${i}`, originalFileName: `r${i}.pdf`, parseStatus: "done", isDefault: i === 0 }));
    renderLibrary({ resumes });

    expect(screen.getByText(/all five slots are in use/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose file" })).not.toBeInTheDocument();
  });
});
