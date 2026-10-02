import type { Metadata } from "next";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · RC Gayaza" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-[#f4f2ee] text-ink">{children}</div>;
}
