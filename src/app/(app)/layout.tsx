import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link href="/" className="leading-none text-royal"><span className="block text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-ink-2">Rotary Club of</span><span className="display text-xl font-semibold">Gayaza</span></Link>
          <Link href="/member" className="text-sm font-semibold text-ink-2 hover:text-royal">Member portal</Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
