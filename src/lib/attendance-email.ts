import "server-only";
import { db } from "./db";
import { emailConfigured, sendEmail } from "./email/resend";
import { makeupCardPdf } from "./makeup-card";
import { formatDate, formatTime, localParts } from "./time";
import { SITE_URL } from "./utils";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const cardNumber = (recordId: string, date: Date) => `RCG-${localParts(date).ymd.replace(/-/g, "")}-${recordId.slice(-6).toUpperCase()}`;

/** Everything needed to build the email and the make-up card for one sign-in. */
async function load(recordId: string) {
  const r = await db.attendanceRecord.findUnique({ where: { id: recordId }, include: { meeting: true, member: { select: { fullName: true } } } });
  if (!r) return null;
  const [club, next] = await Promise.all([
    db.club.findFirst({ where: { isHome: true } }),
    db.event.findFirst({
      where: { status: "APPROVED", scope: "CLUB", startsAt: { gt: new Date(`${localParts(r.meeting.date).ymd}T23:59:59+03:00`) } },
      orderBy: { startsAt: "asc" }, select: { title: true, slug: true, startsAt: true, venue: true },
    }),
  ]);
  return { r, club, next };
}

/** Make-up cards are for visiting Rotarians and Rotaractors (not members, not prospects). */
export const getsMakeupCard = (r: { isGuest: boolean; affiliation: string | null }) => r.isGuest && r.affiliation !== "PROSPECT";

export async function buildMakeupCard(recordId: string) {
  const d = await load(recordId);
  if (!d) return null;
  const { r, club } = d;
  const name = r.name || r.member?.fullName || r.guestName || "Guest";
  return {
    filename: `make-up-card-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${localParts(r.meeting.date).ymd}.pdf`,
    pdf: await makeupCardPdf({
      name, homeClub: r.clubName || r.guestClub || "Rotary family", affiliation: r.affiliation,
      meetingTitle: r.meeting.title, meetingDate: formatDate(r.meeting.date, "day"),
      venue: r.meeting.venue || club?.venue || "Gayaza, Uganda", hostClub: club?.name ?? "Rotary Club of Gayaza",
      district: club?.district ?? "9213", clubId: club?.clubNumber, cardNumber: cardNumber(r.id, r.meeting.date),
    }),
  };
}

function layout(o: { preheader: string; heading: string; paragraphs: string[]; extra?: string }) {
  const site = SITE_URL();
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:#e6eef8;font-family:'Open Sans',Arial,Helvetica,sans-serif;color:#10264d">
<span style="display:none;max-height:0;overflow:hidden">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e6eef8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="height:6px;background:#17458f"></td></tr>
<tr><td style="padding:28px 32px 8px"><img src="${site}/brand/rc-gayaza-logo.png" alt="Rotary Club of Gayaza" width="150" style="display:block;height:auto;border:0"></td></tr>
<tr><td style="padding:12px 32px 4px"><h1 style="margin:0;font-size:24px;line-height:1.25;color:#17458f;font-weight:700">${esc(o.heading)}</h1></td></tr>
<tr><td style="padding:8px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#2c3f63">
${o.paragraphs.map((p) => `<p style="margin:0 0 14px">${p}</p>`).join("\n")}
</td></tr>
${o.extra ?? ""}
<tr><td style="padding:8px 32px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:#2c3f63">With warm regards,<br><strong style="font-family:Arial,sans-serif;color:#17458f">Rotary Club of Gayaza</strong><br><span style="font-size:13px;color:#5b6784">Rotary District 9213 · Service Above Self</span></td></tr>
<tr><td style="height:4px;background:#f7a81b"></td></tr>
</table>
<p style="font-size:12px;color:#5b6784;margin:16px 0 0;line-height:1.5">You are receiving this because you signed in at a Rotary Club of Gayaza meeting.<br><a href="${site}" style="color:#17458f">${site.replace(/^https?:\/\//, "")}</a></p>
</td></tr></table></body></html>`;
}

export async function composeAttendanceEmail(recordId: string) {
  const d = await load(recordId);
  if (!d) return null;
  const { r, club, next } = d;
  const fullName = r.name || r.member?.fullName || r.guestName || "friend";
  const first = esc(fullName.split(/\s+/)[0]);
  const meeting = esc(r.meeting.title);
  const when = esc(formatDate(r.meeting.date, "day"));
  const weekly = club ? `every ${esc(club.meetingDay ?? "Sunday")} at ${esc(club.meetingTime ?? "5:00 PM")}, ${esc(club.venue ?? "Gayaza")}` : "every Sunday";
  const site = SITE_URL();
  const nextBlock = next ? `<tr><td style="padding:4px 32px 12px"><table role="presentation" width="100%" style="background:#e6eef8;border-left:4px solid #f7a81b;border-radius:6px"><tr><td style="padding:14px 16px">
<p style="margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0067c8;font-weight:700">Coming up</p>
<p style="margin:6px 0 2px;font-size:16px;font-weight:700"><a href="${site}/events/${esc(next.slug)}" style="color:#17458f;text-decoration:none">${esc(next.title)}</a></p>
<p style="margin:0;font-size:14px;color:#2c3f63">${esc(formatDate(next.startsAt, "day"))} · ${esc(formatTime(next.startsAt))}${next.venue ? ` · ${esc(next.venue)}` : ""}</p></td></tr></table></td></tr>` : "";

  if (r.isGuest && r.affiliation === "PROSPECT") {
    return {
      to: r.email!, isGuest: true, card: false,
      subject: "Thank you for visiting the Rotary Club of Gayaza",
      html: layout({
        preheader: "Thank you for joining us. Here is how to get involved.",
        heading: `Thank you for visiting, ${first}.`,
        paragraphs: [
          `It was a pleasure to have you with us at <strong>${meeting}</strong> on ${when}. We hope you enjoyed meeting our members and hearing about our work in Gayaza.`,
          `Rotary brings together people who want to make a lasting difference in their community. If you would like to find out more about joining, simply reply to this email or <a href="${site}/contact?interest=join" style="color:#17458f">get in touch on our website</a>.`,
          `You are always welcome back. We meet ${weekly}.`,
        ],
        extra: nextBlock,
      }),
      text: `Thank you for visiting, ${fullName.split(/\s+/)[0]}.\n\nIt was a pleasure to have you with us at ${r.meeting.title} on ${formatDate(r.meeting.date, "day")}. If you would like to find out more about joining Rotary, reply to this email or visit ${site}/contact?interest=join.\n\nYou are always welcome back. We meet ${club ? `every ${club.meetingDay} at ${club.meetingTime}, ${club.venue}` : "every Sunday"}.${next ? `\n\nComing up: ${next.title}, ${formatDate(next.startsAt, "day")} ${formatTime(next.startsAt)}.` : ""}\n\nRotary Club of Gayaza\n${site}`,
      replyTo: club?.email,
    };
  }
  if (r.isGuest) {
    const home = esc(r.clubName || r.guestClub || "your club");
    return {
      to: r.email!, isGuest: true, card: true,
      subject: "Thank you for visiting the Rotary Club of Gayaza",
      html: layout({
        preheader: `Your make-up card for ${formatDate(r.meeting.date, "short")} is attached.`,
        heading: `Thank you for visiting, ${first}.`,
        paragraphs: [
          `It was a pleasure to have you with us at <strong>${meeting}</strong> on ${when}. Thank you for bringing the fellowship of the ${home} to Gayaza.`,
          `Your <strong>make-up card</strong> is attached as a PDF. You can share it with your club secretary so your attendance is recorded.`,
          `You are always welcome back. We meet ${weekly}.`,
        ],
        extra: nextBlock,
      }),
      text: `Thank you for visiting, ${fullName.split(/\s+/)[0]}.\n\nIt was a pleasure to have you with us at ${r.meeting.title} on ${formatDate(r.meeting.date, "day")}. Your make-up card is attached as a PDF; you can share it with your club secretary so your attendance is recorded.\n\nYou are always welcome back. We meet ${club ? `every ${club.meetingDay} at ${club.meetingTime}, ${club.venue}` : "every Sunday"}.${next ? `\n\nComing up: ${next.title}, ${formatDate(next.startsAt, "day")} ${formatTime(next.startsAt)}.` : ""}\n\nRotary Club of Gayaza\n${site}`,
      replyTo: club?.email,
    };
  }
  return {
    to: r.email!, isGuest: false, card: false,
    subject: "Thank you for attending today's meeting",
    html: layout({
      preheader: `Your attendance on ${formatDate(r.meeting.date, "short")} has been recorded.`,
      heading: `Thank you for coming, ${first}.`,
      paragraphs: [
        `Thank you for attending <strong>${meeting}</strong> on ${when}. Your attendance has been recorded.`,
        `See you at the next meeting, ${weekly}.`,
      ],
      extra: nextBlock,
    }),
    text: `Thank you for coming, ${fullName.split(/\s+/)[0]}.\n\nThank you for attending ${r.meeting.title} on ${formatDate(r.meeting.date, "day")}. Your attendance has been recorded.${next ? `\n\nComing up: ${next.title}, ${formatDate(next.startsAt, "day")} ${formatTime(next.startsAt)}.` : ""}\n\nRotary Club of Gayaza\n${site}`,
    replyTo: club?.email,
  };
}

/**
 * Sends the thank-you email for one sign-in (visiting Rotarians/Rotaractors also get the PDF make-up card).
 * Skips silently when emails aren't configured, the person gave no email, or it was already sent
 * (unless `force`, used by the admin "Send again" button). Never throws.
 */
export async function sendAttendanceEmail(recordId: string, { force = false } = {}): Promise<{ status: "SENT" | "FAILED" | "SKIPPED"; error?: string }> {
  try {
    const rec = await db.attendanceRecord.findUnique({ where: { id: recordId }, select: { email: true, emailStatus: true } });
    if (!rec?.email) return { status: "SKIPPED", error: "No email address" };
    if (rec.emailStatus === "SENT" && !force) return { status: "SKIPPED", error: "Already sent" };
    if (!emailConfigured()) {
      await db.attendanceRecord.update({ where: { id: recordId }, data: { emailStatus: "SKIPPED", emailError: "Email sending is not set up (RESEND_API_KEY)" } });
      return { status: "SKIPPED", error: "Email sending is not set up" };
    }
    const mail = await composeAttendanceEmail(recordId);
    if (!mail) return { status: "SKIPPED", error: "Sign-in not found" };
    const card = mail.card ? await buildMakeupCard(recordId) : null;
    await sendEmail({
      to: mail.to, subject: mail.subject, html: mail.html, text: mail.text, replyTo: mail.replyTo,
      attachments: card ? [{ filename: card.filename, content: card.pdf }] : [],
      idempotencyKey: force ? undefined : `attendance-${recordId}`,
    });
    await db.attendanceRecord.update({ where: { id: recordId }, data: { emailStatus: "SENT", emailSentAt: new Date(), emailError: null } });
    return { status: "SENT" };
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 300) : "Unknown error";
    console.error("[attendance-email]", recordId, error);
    await db.attendanceRecord.update({ where: { id: recordId }, data: { emailStatus: "FAILED", emailError: error } }).catch(() => {});
    return { status: "FAILED", error };
  }
}
