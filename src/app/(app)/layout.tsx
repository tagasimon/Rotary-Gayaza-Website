import Link from "next/link";
import { CLUB_LOGO } from "@/components/site/Wordmark";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-paper-2">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src={CLUB_LOGO} alt="Rotary Club of Gayaza" className="h-10 w-auto" /></Link>
          <Link href="/" className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted hover:text-ink">Website</Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
