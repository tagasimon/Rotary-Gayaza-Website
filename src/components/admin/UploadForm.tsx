"use client";
import { useActionState } from "react";
import { uploadMedia } from "@/app/admin/(panel)/media/actions";
export function UploadForm({ albums }: { albums: { id: string; title: string }[] }) {
  const [s, act, p] = useActionState(uploadMedia, {});
  return (
    <form action={act} className="grid gap-3 sm:grid-cols-[1fr_200px_160px_auto] sm:items-end">
      <label><span className="label">Photos, videos or PDFs</span><input type="file" name="files" multiple accept="image/*,video/mp4,application/pdf" className="field" /></label>
      <label><span className="label">Add to album</span><select name="albumId" className="field"><option value="">No album</option>{albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
      <label><span className="label">Credit</span><input name="credit" className="field" placeholder="Photographer" /></label>
      <button disabled={p} className="btn btn-royal !min-h-0 !py-2">{p ? "Uploading…" : "Upload"}</button>
      {(s.ok || s.error) && <p className="text-sm sm:col-span-4">{s.ok ? <span className="font-semibold text-leaf">{s.ok} uploaded ✓ — add alt text to each.</span> : null} {s.error && <span className="text-soil">{s.error}</span>}</p>}
    </form>
  );
}
