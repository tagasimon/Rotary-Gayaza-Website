import "server-only";

export type Attachment = { filename: string; content: Uint8Array | Buffer };
export type OutgoingEmail = { to: string; subject: string; html: string; text: string; replyTo?: string | null; attachments?: Attachment[]; idempotencyKey?: string };

export const emailConfigured = () => !!process.env.RESEND_API_KEY && process.env.ATTENDANCE_EMAILS !== "false";
export const emailFrom = () => process.env.EMAIL_FROM || "Rotary Club of Gayaza <meetings@rotarygayaza.org>";

/** Sends one email through Resend's HTTP API (no SDK needed). Throws with Resend's message on failure. */
export async function sendEmail(e: OutgoingEmail): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(e.idempotencyKey ? { "Idempotency-Key": e.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [e.to],
      subject: e.subject,
      html: e.html,
      text: e.text,
      ...(e.replyTo ? { reply_to: e.replyTo } : {}),
      ...(e.attachments?.length ? { attachments: e.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })) } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (!res.ok || !body.id) throw new Error(body.message || `Resend responded ${res.status}`);
  return { id: body.id };
}
