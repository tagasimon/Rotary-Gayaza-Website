import "server-only";
import type { Field, Resource } from "./resources";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import { storeFile } from "@/lib/storage";
import { db } from "@/lib/db";

type Row = Record<string, unknown>;

/** FormData -> prisma data, according to field config. Uploads files for image fields. */
export async function parseForm(res: Resource, form: FormData, actorId: string): Promise<{ data: Row; errors: string[] }> {
  const data: Row = {};
  const errors: string[] = [];
  for (const f of res.fields) {
    const raw = form.get(f.name);
    const str = typeof raw === "string" ? raw.trim() : "";
    switch (f.type) {
      case "boolean": data[f.name] = form.get(f.name) === "on"; break;
      case "number": data[f.name] = str === "" ? null : Number(str); if (str && Number.isNaN(data[f.name])) errors.push(`${f.label} must be a number`); break;
      case "int": data[f.name] = str === "" ? (f.name.toLowerCase().includes("order") ? 0 : null) : parseInt(str, 10); break;
      case "date": data[f.name] = str ? fromLocalInput(str.slice(0, 10)) : null; break;
      case "datetime": data[f.name] = str ? fromLocalInput(str) : null; break;
      case "list": data[f.name] = str.split("\n").map((s) => s.trim()).filter(Boolean); break;
      case "relation": data[f.name] = str || null; break;
      case "image": {
        const file = form.get(`${f.name}__file`);
        if (file instanceof File && file.size > 0) {
          try {
            const stored = await storeFile(file, "media");
            await db.media.create({ data: { url: stored.url, storageKey: stored.key, mimeType: file.type, alt: String(form.get("title") ?? form.get("name") ?? form.get("alt") ?? "").slice(0, 200) || null, createdById: actorId } });
            data[f.name] = stored.url;
          } catch (e) { errors.push(`${f.label}: ${(e as Error).message}`); }
        } else data[f.name] = str || null;
        break;
      }
      default: data[f.name] = str === "" ? null : str;
    }
    if (f.required && (data[f.name] === null || data[f.name] === "" || data[f.name] === undefined)) errors.push(`${f.label} is required`);
    if (f.type === "url" && typeof data[f.name] === "string" && !/^https?:\/\//.test(data[f.name] as string)) errors.push(`${f.label} must start with http:// or https://`);
  }
  // Non-nullable string columns with defaults: drop nulls so Prisma keeps the default
  for (const [k, v] of Object.entries(data)) if (v === null && ["status", "verification", "type", "scope", "kind", "audience", "relationshipType"].includes(k)) delete data[k];
  return { data, errors };
}

/** DB row -> string values for the form */
export function toFormValues(res: Resource, row: Row | null): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const f of res.fields) {
    const v = row?.[f.name];
    if (f.type === "boolean") out[f.name] = Boolean(v);
    else if (f.type === "date") out[f.name] = v ? toLocalInput(v as Date, true) : "";
    else if (f.type === "datetime") out[f.name] = v ? toLocalInput(v as Date) : "";
    else if (f.type === "list") out[f.name] = Array.isArray(v) ? v.join("\n") : "";
    else out[f.name] = v === null || v === undefined ? "" : String(v);
  }
  return out;
}

export function fieldDefault(f: Field): string | boolean {
  if (f.type === "boolean") return false;
  if (f.type === "select" && f.options?.length) { const o = f.options[0]; return typeof o === "string" ? o : o[0]; }
  return "";
}
