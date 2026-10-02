export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

export function normalizeTitle(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(the|a|an|of|to|rc|rotary|club)\b/g, " ").replace(/\s+/g, " ").trim();
}
