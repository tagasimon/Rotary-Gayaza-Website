import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center bg-paper px-6 text-center">
      <div>
        <p className="eyebrow text-soil">404</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">This branch hasn&rsquo;t grown yet.</h1>
        <p className="mt-4 text-ink-2">The page you were looking for isn&rsquo;t here.</p>
        <Link href="/" className="btn btn-royal mt-8">Back to the homepage</Link>
      </div>
    </main>
  );
}
