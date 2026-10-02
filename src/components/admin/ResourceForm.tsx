"use client";
import { useActionState, useState } from "react";
import type { Field } from "@/lib/admin/resources";
import type { SaveState } from "@/app/admin/(panel)/content/[resource]/actions";

type Opt = { value: string; label: string };

export function ResourceForm({ fields, values, relationOptions, action, mediaUrls }: {
  fields: Field[]; values: Record<string, string | boolean>; relationOptions: Record<string, Opt[]>;
  action: (s: SaveState, f: FormData) => Promise<SaveState>; mediaUrls: string[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const sections: { name: string; fields: Field[] }[] = [];
  for (const f of fields) {
    const name = f.section ?? "";
    const s = sections.find((x) => x.name === name) ?? (sections.push({ name, fields: [] }), sections[sections.length - 1]);
    s.fields.push(f);
  }
  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      <datalist id="media-urls">{mediaUrls.map((u) => <option key={u} value={u} />)}</datalist>
      {sections.map((s) => (
        <fieldset key={s.name || "main"} className="card p-5">
          {s.name && <legend className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-soil">{s.name}</legend>}
          <div className="grid gap-4 md:grid-cols-2">{s.fields.map((f) => <FieldInput key={f.name} f={f} v={values[f.name]} opts={relationOptions[f.name]} />)}</div>
        </fieldset>
      ))}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 border-t border-ink/10 bg-[#f4f2ee]/95 px-1 py-3 backdrop-blur">
        <button className="btn btn-royal" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        {state.saved && <span role="status" className="text-sm font-semibold text-leaf">Saved ✓</span>}
        {state.error && <span role="alert" className="text-sm font-semibold text-soil">{state.error}</span>}
      </div>
    </form>
  );
}

function FieldInput({ f, v, opts }: { f: Field; v: string | boolean | undefined; opts?: Opt[] }) {
  const id = `f-${f.name}`;
  const wide = f.wide || f.type === "markdown" || f.type === "textarea" ? "md:col-span-2" : "";
  const label = <label htmlFor={id} className="label">{f.label}{f.required && <span className="text-soil"> *</span>}</label>;
  const help = f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>;
  const sv = typeof v === "string" ? v : "";
  switch (f.type) {
    case "boolean":
      return <label className={`flex items-center gap-3 self-end py-2 text-sm font-semibold ${wide}`}><input id={id} type="checkbox" name={f.name} defaultChecked={Boolean(v)} className="h-5 w-5 accent-royal" />{f.label}{help}</label>;
    case "textarea":
    case "list":
      return <div className={wide || "md:col-span-1"}>{label}<textarea id={id} name={f.name} defaultValue={sv} rows={f.type === "list" ? 3 : 4} className="field" />{help}</div>;
    case "markdown":
      return <div className="md:col-span-2">{label}<textarea id={id} name={f.name} defaultValue={sv} rows={10} className="field font-mono text-[13px]" /><p className="mt-1 text-xs text-muted">Markdown: **bold**, *italic*, ## heading, - list, [link](https://…){f.help ? ` · ${f.help}` : ""}</p></div>;
    case "select":
      return <div className={wide}>{label}<select id={id} name={f.name} defaultValue={sv} className="field">{!f.required && <option value="">—</option>}{f.options!.map((o) => { const [val, lab] = typeof o === "string" ? [o, o.replace(/_/g, " ").toLowerCase()] : o; return <option key={val} value={val}>{lab}</option>; })}</select>{help}</div>;
    case "relation":
      return <div className={wide}>{label}<select id={id} name={f.name} defaultValue={sv} className="field" required={f.required}><option value="">—</option>{(opts ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{help}</div>;
    case "image":
      return <ImageField f={f} v={sv} wide={wide} />;
    default: {
      const type = f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : f.type === "int" ? "number" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text";
      return <div className={wide}>{label}<input id={id} name={f.name} type={type} step={f.type === "number" ? "any" : undefined} defaultValue={sv} className="field" />{help}</div>;
    }
  }
}

function ImageField({ f, v, wide }: { f: Field; v: string; wide: string }) {
  const [url, setUrl] = useState(v);
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className={wide || "md:col-span-1"}>
      <label htmlFor={`f-${f.name}`} className="label">{f.label}{f.required && <span className="text-soil"> *</span>}</label>
      <div className="flex gap-3">
        {(preview || url) && /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(preview ? ".jpg" : url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview ?? url} alt="" className="h-16 w-24 shrink-0 rounded object-cover ring-1 ring-ink/10" />
        )}
        <div className="flex-1 space-y-2">
          <input id={`f-${f.name}`} name={f.name} value={url} onChange={(e) => setUrl(e.target.value)} list="media-urls" placeholder="Paste a URL, pick from the library, or upload" className="field" />
          <input type="file" name={`${f.name}__file`} accept="image/*,application/pdf" onChange={(e) => { const file = e.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : null); }} className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-royal file:px-3 file:py-1.5 file:text-white" />
        </div>
      </div>
      {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
    </div>
  );
}
