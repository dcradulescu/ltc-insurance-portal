import { useSearch } from "wouter";
import { useRef, useState, type FormEvent } from "react";
import { FileText, FolderOpen, Upload, Download, Trash2, Loader2, Search, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";

const selectClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#24899a] disabled:opacity-50";
const mimeByExtension: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
function sizeLabel(bytes: number | null) {
  if (bytes === null) return "Size unavailable";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}
function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this file. Please choose it again."));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

export default function Documents() {
  const params = new URLSearchParams(useSearch());
  const taskMode = params.has("taskId") || params.has("strategyId");
  const strategyId = Number(params.get("strategyId"));
  const taskId = params.get("taskId") || "";
  const validContext = Number.isSafeInteger(strategyId) && strategyId > 0 && taskId.length > 0 && taskId.length <= 128;
  const accountDocuments = trpc.documents.list.useQuery(undefined, { retry: false, enabled: !taskMode });
  const taskDocuments = trpc.documents.taskDocuments.useQuery({ strategyId, taskId }, { retry: false, enabled: taskMode && validContext });
  const documents = taskMode ? { ...taskDocuments, data: taskDocuments.data?.documents } : accountDocuments;
  const contextReady = !taskMode || (validContext && !!taskDocuments.data && !taskDocuments.isError);

  const available = trpc.documents.availableForTask.useQuery({ strategyId, taskId }, { retry: false, enabled: taskMode && contextReady });
  const attach = trpc.documents.attachToTask.useMutation({ retry: false });
  const detach = trpc.documents.detachFromTask.useMutation({ retry: false });
  const [existingId, setExistingId] = useState("");
  const [linkError, setLinkError] = useState("");
  const linking = attach.isPending || detach.isPending;
  const requirements = trpc.documents.getRequirements.useQuery(undefined, { staleTime: Infinity, retry: false });
  const upload = trpc.documents.upload.useMutation({ retry: false });
  const remove = trpc.documents.delete.useMutation({ retry: false });
  const utils = trpc.useUtils();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Insurance Policy");
  const [filter, setFilter] = useState("All categories");
  const [search, setSearch] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [selected, setSelected] = useState<{ id: number; fileName: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploading = preparing || upload.isPending;
  const categories = requirements.data?.categories || [];
  const allowed = categories.find(value => value.name === category)?.allowedTypes || [];
  const extensions = Object.entries(mimeByExtension).filter(([, mime]) => allowed.includes(mime)).map(([extension]) => `.${extension}`);
  const shown = (documents.data || []).filter(doc => (filter === "All categories" || doc.category === filter) && doc.fileName.toLowerCase().includes(search.trim().toLowerCase()));

  async function submit(event: FormEvent) {
    event.preventDefault(); setUploadError(""); setNotice("");
    if (!file || !requirements.data || !contextReady) return;
    const mimeType = file.type || mimeByExtension[file.name.split(".").pop()?.toLowerCase() || ""] || "";
    if (!file.size) { setUploadError("This file is empty. Choose a file with content."); return; }
    if (file.size > requirements.data.maxFileSize) { setUploadError("Choose a file no larger than 50 MB."); return; }
    if (!allowed.includes(mimeType)) { setUploadError(`Choose an allowed file type for ${category}: ${extensions.join(", ")}.`); return; }
    setPreparing(true);
    try {
      const fileData = await readBase64(file);
      await upload.mutateAsync({ fileName: file.name, fileData, mimeType, category, ...(taskMode ? { strategyId, taskId } : {}) });
      setNotice(`${file.name} uploaded ${taskMode ? "and linked to this task" : "to your account"}.`);
      setFile(null); if (fileInput.current) fileInput.current.value = "";
      setFilter("All categories"); setSearch("");
      await utils.documents.invalidate();
    } catch (error: any) {
      setUploadError(error?.data?.code === "BAD_REQUEST" ? error.message : "Upload could not be confirmed. Refresh the document list before retrying to avoid duplicates.");
    } finally { setPreparing(false); }
  }
  async function changeTaskLink(documentId: number, fileName: string, action: "attach" | "detach") {
    if (!taskMode || !contextReady || linking) return;
    setLinkError(""); setNotice("");
    try {
      await (action === "attach" ? attach : detach).mutateAsync({ documentId, strategyId, taskId });
      setNotice(action === "attach" ? `${fileName} attached to this task.` : `${fileName} detached from this task and kept in your account.`);
      setExistingId("");
      await utils.documents.invalidate();
    } catch (error: any) {
      setLinkError(error?.data?.code === "CONFLICT" || error?.data?.code === "BAD_REQUEST" ? error.message : "The change could not be confirmed. Refresh the documents before trying again.");
    }
  }
  async function confirmRemove() {
    if (!selected) return;
    setRemoveError("");
    try {
      await remove.mutateAsync({ id: selected.id });
      setNotice(`${selected.fileName} removed from your portal.`);
      setSelected(null); await utils.documents.invalidate();
    } catch { setRemoveError("Removal could not be confirmed. Refresh the list before trying again."); }
  }

  return <Layout>
    <section className="border-b border-slate-200 bg-[#f2f8fa]">
      <div className="container max-w-6xl py-10 sm:py-12">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#24899a]"><FolderOpen className="h-5 w-5" aria-hidden="true" />YOUR ACCOUNT</div>
        <h1 className="text-3xl font-bold text-[#393F43] sm:text-4xl">Your documents</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">Keep your insurance policy, care records, and supporting paperwork together.</p>
        <p className="mt-4 flex items-start gap-2 text-sm text-slate-600"><ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#24899a]" aria-hidden="true" />Only documents belonging to your signed-in account appear here.</p>
      </div>
    </section>
    <main className="container max-w-6xl py-8 sm:py-10">
      {taskMode && <section className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-5" aria-label="Task context">
        <p className="text-sm font-semibold text-teal-800">Task documents</p>
        {!validContext || taskDocuments.isError ? <p role="alert" className="mt-2 text-sm text-red-800">This task could not be opened. Return to your strategy and choose a task.</p> : taskDocuments.isPending ? <p role="status" className="mt-2 text-sm">Loading task…</p> : <><h2 className="mt-2 break-words text-lg font-semibold text-slate-800">{taskDocuments.data?.taskLabel}</h2><p className="mt-2 text-sm text-slate-600">Files uploaded here are linked to this task. Uploading does not mark the task complete.</p></>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[#24899a]"><a href="/strategy">Return to strategy</a><a href="/documents">View all documents</a></div>
      </section>}
      {taskMode && contextReady && <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="existing-document-heading">
        <h2 id="existing-document-heading" className="text-lg font-semibold text-slate-800">Use an existing document</h2>
        <p className="mt-2 text-sm text-slate-600">Choose a document from your account that is not attached to a task. Files associated with another policy or strategy are excluded.</p>
        {available.isPending ? <p role="status" className="mt-4 text-sm">Loading available documents…</p> : available.isError ? <div role="alert" className="mt-4 text-sm text-red-800"><p>Available documents could not be loaded.</p><Button variant="outline" className="mt-2" onClick={() => available.refetch()}>Retry available documents</Button></div> : !available.data?.length ? <p className="mt-4 text-sm text-slate-500">No unassigned documents are available for this task. You can upload a new file below.</p> : <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={event => { event.preventDefault(); const doc = available.data?.find(doc => String(doc.id) === existingId); if (doc) void changeTaskLink(doc.id, doc.fileName, "attach"); }}>
          <div className="min-w-0 flex-1"><Label htmlFor="existing-document">Existing document</Label><select id="existing-document" className={`${selectClass} mt-2`} value={existingId} disabled={linking || available.isFetching} onChange={event => { setExistingId(event.target.value); setLinkError(""); }}><option value="">Choose a document</option>{available.data.map(doc => <option key={doc.id} value={doc.id}>{doc.fileName} — {doc.category}</option>)}</select></div>
          <Button type="submit" className="bg-[#24899a] text-white hover:bg-[#1b7180]" disabled={linking || available.isFetching || !available.data.some(doc => String(doc.id) === existingId)}>{attach.isPending ? "Attaching…" : "Attach to task"}</Button>
        </form>}
      </section>}
      {linkError && <p role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{linkError}</p>}
      {notice && <p role="status" className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 break-words">{notice}</p>}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0" aria-labelledby="saved-documents-heading">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 id="saved-documents-heading" className="text-xl font-semibold text-[#393F43]">Saved documents</h2><Button variant="outline" onClick={() => { void documents.refetch(); if (taskMode && contextReady) void available.refetch(); }} disabled={documents.isFetching}>{documents.isFetching ? "Refreshing…" : "Refresh"}</Button></div>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="document-search">Search by filename</Label><div className="relative mt-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" /><Input id="document-search" className="h-10 pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a document" /></div></div>
            <div><Label htmlFor="document-filter">Filter by category</Label><select id="document-filter" className={`${selectClass} mt-2`} value={filter} onChange={e => setFilter(e.target.value)}><option>All categories</option>{Array.from(new Set([...categories.map(c => c.name), ...(documents.data || []).map(d => d.category)])).map(name => <option key={name}>{name}</option>)}</select></div>
          </div>
          {taskMode && !validContext ? null : documents.isPending ? <p role="status" className="p-8 text-center text-slate-500">Loading your documents…</p> : documents.isError ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">Your documents could not be loaded. Use Refresh to try again.</div> : shown.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><FolderOpen className="mx-auto mb-4 h-9 w-9 text-[#24899a]" aria-hidden="true" /><h3 className="font-semibold text-slate-700">{documents.data?.length ? "No matching documents" : taskMode ? "No documents attached" : "No documents yet"}</h3><p className="mt-2 text-sm text-slate-500">{documents.data?.length ? "Try another filename or category." : taskMode ? "Choose an existing document above or upload a new file below." : "Upload your first document using the form on this page."}</p></div> : <>
            <p className="mb-3 text-sm text-slate-500" aria-live="polite">{shown.length} of {documents.data?.length} document(s)</p>
            <ul className="space-y-3" aria-label="Saved documents">{shown.map(doc => <li key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3"><div className="rounded-lg bg-[#edf7f8] p-2.5 text-[#24899a]"><FileText className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0 flex-1"><h3 className="break-words font-semibold text-slate-800">{doc.fileName}</h3><p className="mt-1 text-sm text-slate-500">{doc.category}</p><p className="mt-1 text-xs text-slate-500">{sizeLabel(doc.fileSize)} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p></div></div>
              {taskMode && <p className="mt-3 text-xs text-slate-500">Detach keeps the file in your account. Remove revokes access through your portal.</p>}
              <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">{taskMode && <Button variant="outline" size="sm" disabled={linking || !contextReady} aria-label={`Detach ${doc.fileName} from task`} onClick={() => changeTaskLink(doc.id, doc.fileName, "detach")}>{detach.isPending && detach.variables?.documentId === doc.id ? "Detaching…" : "Detach from task"}</Button>}<Button variant="outline" size="sm" asChild><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${doc.fileName}`}><Download aria-hidden="true" />Download</a></Button><Button variant="ghost" size="sm" className="text-slate-600" aria-label={`Remove ${doc.fileName}`} onClick={() => { setSelected(doc); setRemoveError(""); }}><Trash2 aria-hidden="true" />Remove</Button></div>
            </li>)}</ul>
          </>}
        </section>
        <aside className="self-start rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-xl font-semibold text-[#393F43]">Upload a document</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Choose a category, then add one file up to 50 MB.</p>
          {requirements.isError ? <div role="alert" className="mt-5 space-y-3 text-sm text-red-800"><p>Upload requirements could not be loaded.</p><Button variant="outline" onClick={() => requirements.refetch()}>Retry requirements</Button></div> : requirements.isPending ? <p role="status" className="mt-5 text-sm">Loading upload requirements…</p> : <form className="mt-6 space-y-5" onSubmit={submit}>
            <div><Label htmlFor="upload-category">Document category</Label><select id="upload-category" className={`${selectClass} mt-2`} value={category} disabled={uploading} onChange={e => { setCategory(e.target.value); setUploadError(""); }}>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select></div>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"><Upload className="mb-3 h-6 w-6 text-[#24899a]" aria-hidden="true" /><Label htmlFor="document-file">Choose a file</Label><Input ref={fileInput} id="document-file" type="file" className="mt-2 h-auto min-h-10 w-full max-w-full cursor-pointer text-xs file:mr-2 file:font-semibold" accept={extensions.join(",")} disabled={uploading} onChange={e => { setFile(e.target.files?.[0] || null); setUploadError(""); }} aria-describedby="file-types" /><p id="file-types" className="mt-3 text-xs leading-relaxed text-slate-500">Allowed: {extensions.join(", ")}.</p>{file && <p className="mt-2 break-words text-xs text-slate-600">{file.name} · {sizeLabel(file.size)}</p>}</div>
            {uploadError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{uploadError}</p>}
            <Button type="submit" className="h-11 w-full bg-[#24899a] text-white hover:bg-[#1b7180]" disabled={!file || uploading || !contextReady}>{uploading ? <><Loader2 className="animate-spin" aria-hidden="true" />Uploading…</> : <><Upload aria-hidden="true" />Upload document</>}</Button>
            {uploading && <p role="status" className="text-xs text-slate-500">Keep this page open until the upload finishes.</p>}
            <p className="text-xs leading-relaxed text-slate-500">Uploading here does not submit a claim or send your documents to an insurer.</p>
          </form>}
        </aside>
      </div>
    </main>
    <AlertDialog open={!!selected} onOpenChange={open => { if (!open && !remove.isPending) setSelected(null); }}><AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md"><AlertDialogHeader><AlertDialogTitle>Remove this document?</AlertDialogTitle><AlertDialogDescription><span className="block break-words font-semibold text-slate-700 mb-3">{selected?.fileName}</span>This removes access through your portal; it does not permanently erase the stored file. Contact the office for permanent removal. Previously issued download links may work until they expire.</AlertDialogDescription></AlertDialogHeader>{removeError && <p role="alert" className="text-sm text-red-800">{removeError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={remove.isPending}>Keep document</AlertDialogCancel><Button variant="destructive" onClick={confirmRemove} disabled={remove.isPending}>{remove.isPending ? "Removing…" : "Remove from portal"}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Layout>;
}
