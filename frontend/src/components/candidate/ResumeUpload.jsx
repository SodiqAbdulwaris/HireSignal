import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { fmtDate } from "../../lib/utils";
import { uploadResume, getMyResumes, setDefaultResume, deleteResume } from "../../lib/api";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";

const PARSE_STATES = {
  done: ["Ready", "Information extracted. Review your profile before applying."],
  needs_review: ["Needs review", "Some information may be missing or inaccurate. Check your profile against the original resume."],
  failed: ["Could not extract details", "Try a text-based PDF or DOCX with clearly labeled sections."],
  processing: ["Processing", "Your resume is being processed. Refresh the library to check its status."],
  pending: ["Waiting to process", "Your file has been received and is waiting to be processed."],
};
export function ResumeLibrary({ resumes, loadingList = false, listError, onRefresh, onUpload, onDefault, onDelete }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  function choose(selected) {
    if (busy || !selected) return;
    setFile(null); setError(null); setMessage(null);
    if (!["pdf", "docx"].includes(selected.name.split(".").pop().toLowerCase())) { setError("Choose a PDF or DOCX file."); return; }
    if (selected.size > 5 * 1024 * 1024) { setError("Choose a file smaller than 5 MB."); return; }
    if (!selected.size) { setError("This file is empty. Choose a different resume."); return; }
    setFile(selected);
  }
  async function act(key, operation, successMessage) {
    if (busy) return;
    setBusy(key); setError(null); setMessage(null);
    try {
      const result = await operation();
      if (!result.success) setError(result.message || "Could not complete that action. Try again.");
      else { setMessage(successMessage); if (key === "upload") { setFile(null); if (input.current) input.current.value = ""; } setDeleteId(null); }
    } catch { setError("Could not complete that action. Try again."); }
    finally { setBusy(null); }
  }
  const atLimit = resumes.length >= 5;
  return <div className="library-layout">
    <section className="library-files"><div className="section-heading"><h2>Your files</h2><span>{loadingList ? "Loading…" : `${resumes.length} of 5 slots used`}</span></div><Alert message={listError || error} /><Alert message={message} variant="success" />
      <div className="context-note mb-6">Your default file is used for applications. Changing the default does not re-extract your profile; profile details come from the latest processed upload.<Link className="text-link mt-2 block" to="/profile">Review your profile →</Link></div>
      {loadingList ? <p className="py-6 text-sm text-muted-foreground" role="status">Loading your resume library…</p> : listError ? <Btn variant="secondary" onClick={onRefresh}>Try again</Btn> : <>
        {!resumes.length && <div className="empty-panel"><h2>Add your first resume.</h2><p>Upload a PDF or DOCX to build your profile. You can review the extracted information afterwards.</p></div>}
        <div className="record-list">{resumes.map(resume => {
          const [label, description] = PARSE_STATES[resume.parseStatus] || ["Status unavailable", "Refresh the library to check this file’s status."];
          return <article key={resume._id} className="resume-record"><div className="section-heading"><h3>{resume.originalFileName}</h3>{resume.isDefault && <span className="record-status">Default</span>}</div><p className="record-meta">{Number.isFinite(resume.fileSize) ? `${Math.round(resume.fileSize / 1024)} KB · ` : ""}Uploaded {fmtDate(resume.createdAt)}</p><div className="resume-processing"><strong>{label}</strong><p>{description}</p>{resume.parseStatus === "failed" && resume.parseError && <details><summary>See processing details</summary><p>{resume.parseError}</p></details>}</div>
          <div className="flex flex-wrap items-center gap-3">{!resume.isDefault && <Btn variant="secondary" disabled={Boolean(busy)} onClick={() => act(resume._id, () => onDefault(resume._id), "Default file updated. Your extracted profile has not changed.")}>{busy === resume._id ? "Saving…" : "Make default"}</Btn>}<details className="record-options"><summary>File options</summary><Btn className="mt-2" variant="secondary" disabled={Boolean(busy) || resumes.length <= 1} onClick={() => setDeleteId(resume._id)}>Delete file</Btn>{resumes.length <= 1 && <p className="record-meta mt-2">Keep at least one resume in your library.</p>}</details></div>
          {deleteId === resume._id && <div className="inline-confirm mt-4"><p>Delete <strong>{resume.originalFileName}</strong>?{resume.isDefault && " Your most recent remaining resume will become the default."}</p><div className="flex flex-wrap gap-2"><Btn variant="secondary" disabled={Boolean(busy)} onClick={() => setDeleteId(null)}>Keep file</Btn><Btn variant="danger" disabled={Boolean(busy)} onClick={() => act(resume._id, () => onDelete(resume._id), "Resume deleted.")}>Confirm delete</Btn></div></div>}</article>;
        })}</div><button className="text-link mt-4" disabled={Boolean(busy)} onClick={onRefresh}>Refresh library</button>
      </>}
    </section>
    <aside className="upload-panel"><div className="page-eyebrow">Keep your experience current</div><h2>Add a resume</h2><p>PDF or DOCX · Up to 5 MB</p>{atLimit ? <div className="context-note mt-5">All five slots are in use. Delete a file to add another.</div> : <>
      <div className={`upload-zone ${dragging ? "is-dragging" : ""}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]); }}><span aria-hidden="true" className="upload-symbol">↑</span><h3>Bring your experience in.</h3><p>Drop a file here, or choose one from your device.</p><input ref={input} id="resume-file" type="file" accept=".pdf,.docx" className="sr-only" tabIndex={-1} onChange={event => { choose(event.target.files?.[0]); event.target.value = ""; }} /><Btn variant="secondary" disabled={Boolean(busy) || loadingList || Boolean(listError)} onClick={() => input.current?.click()}>Choose file</Btn></div>
      {file && <div className="selected-file"><h3>{file.name}</h3><p>{Math.round(file.size / 1024)} KB · Ready to upload</p><div className="mt-4 flex flex-wrap gap-2"><Btn disabled={Boolean(busy)} onClick={() => act("upload", () => onUpload(file), "Resume uploaded. Check its processing status in your library.")}>{busy === "upload" ? "Uploading…" : "Upload resume"}</Btn><Btn variant="ghost" disabled={Boolean(busy)} onClick={() => setFile(null)}>Remove</Btn></div></div>}
    </>}<div className="upload-guidance"><h3>For a clearer profile</h3><p>Use selectable text and clearly labeled sections for experience, education and skills. After uploading, check the extracted information.</p></div></aside>
  </div>;
}
export default function ResumeUpload() {
  const { token, loadAll: onUploaded } = useOutletContext();
  const [resumes, setResumes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);
  const refresh = useCallback(async () => {
    setLoadingList(true); setListError(null);
    try { const result = await getMyResumes(token); if (result.success) setResumes(result.data); else setListError(result.message || "Could not load your resumes."); }
    catch { setListError("Could not load your resumes. Try again."); }
    finally { setLoadingList(false); }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);
  async function mutate(operation) {
    const result = await operation();
    if (result.success) { await refresh(); onUploaded(); }
    return result;
  }
  return <ResumeLibrary resumes={resumes} loadingList={loadingList} listError={listError} onRefresh={refresh} onUpload={file => { const data = new FormData(); data.append("file", file); return mutate(() => uploadResume(data, token)); }} onDefault={id => mutate(() => setDefaultResume(id, token))} onDelete={id => mutate(() => deleteResume(id, token))} />;
}
