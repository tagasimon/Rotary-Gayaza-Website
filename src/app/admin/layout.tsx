import type { Metadata } from "next";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · RC Gayaza" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-[#f3f6fb] text-ink">{children}</div>;
}
