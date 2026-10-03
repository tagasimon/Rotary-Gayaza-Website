import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
export const metadata = { title: "Sign in" };
export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-svh place-items-center bg-royal px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-2xl">
        <p className="eyebrow text-soil">Rotary Club of Gayaza</p>
        <h1 className="display mt-2 text-3xl">Club admin</h1>
        <p className="mt-1 text-sm text-muted">For officers who manage the website, members and attendance.</p>
        <div className="mt-6"><LoginForm /></div>
        <p className="mt-6 text-center text-xs text-muted">Signing in to fellowship? Use the <a className="underline" href="/attend">attendance form</a>.</p>
      </div>
    </div>
  );
}
