import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMember } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Member login", robots: { index: false } };

export default async function MemberLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getMember()) redirect("/member");
  const { next } = await searchParams;
  return (
    <div className="pt-6">
      <p className="eyebrow text-soil">Member portal</p>
      <h1 className="display mt-2 text-4xl">Welcome back.</h1>
      <p className="mt-2 text-ink-2">Sign in with your member number and PIN. The club secretary can give you both.</p>
      <div className="mt-8 rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/5"><LoginForm next={next} /></div>
      <p className="mt-6 text-center text-sm text-muted">Club officers: <a href="/admin/login" className="underline">admin sign-in</a></p>
    </div>
  );
}
