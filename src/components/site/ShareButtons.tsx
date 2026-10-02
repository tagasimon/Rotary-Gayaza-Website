"use client";
import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { label: "X", href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}&via=Rcgayaza` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1 text-muted">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="chip hover:border-royal hover:text-royal">{l.label}</a>
      ))}
      <button type="button" className="chip hover:border-royal hover:text-royal" onClick={async () => {
        if (navigator.share) { try { await navigator.share({ title, url }); return; } catch { /* cancelled */ } }
        await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000);
      }}>{copied ? "Copied" : "Copy link"}</button>
    </div>
  );
}
