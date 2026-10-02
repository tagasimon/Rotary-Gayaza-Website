import { destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
export async function GET() {
  await destroySession("member");
  redirect("/member/login");
}
