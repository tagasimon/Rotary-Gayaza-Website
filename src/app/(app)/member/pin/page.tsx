import { requireMember } from "@/lib/auth";
import { PinForm } from "./PinForm";
export const metadata = { title: "Change PIN", robots: { index: false } };
export default async function PinPage() {
  await requireMember();
  return (<div><a href="/member" className="text-sm text-muted underline">← Back</a><h1 className="display mt-4 text-4xl">Change your PIN</h1><div className="mt-6 rounded-lg bg-white p-5 ring-1 ring-ink/5"><PinForm /></div></div>);
}
