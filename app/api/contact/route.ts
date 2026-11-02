import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { renderQuoteEmail } from "@/lib/contact-email";

export const runtime = "nodejs";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestsByIp = new Map<string, number[]>();

function field(value: FormDataEntryValue | null, max: number): string | null {
  if (typeof value !== "string") return "";
  const v = value.trim();
  return v.length <= max ? v : null;
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  for (const [key, times] of requestsByIp) {
    const active = times.filter((time) => now - time < WINDOW_MS);
    if (active.length) requestsByIp.set(key, active);
    else requestsByIp.delete(key);
  }
  const attempts = requestsByIp.get(ip) ?? [];
  if (attempts.length >= MAX_REQUESTS) return fail("Trop de demandes. Merci de réessayer dans quelques minutes.", 429);
  attempts.push(now);
  requestsByIp.set(ip, attempts);

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return fail("La demande envoyée est invalide.", 400);
  }
  if (data.get("site_web")) return NextResponse.json({ ok: true });

  const nom = field(data.get("nom"), 120);
  const entreprise = field(data.get("entreprise"), 200);
  const telephone = field(data.get("telephone"), 50);
  const email = field(data.get("email"), 254);
  const prestation = field(data.get("prestation"), 200);
  const teinte = field(data.get("teinte"), 100);
  const piece = field(data.get("piece"), 5000);

  if (
    !nom || !telephone || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    entreprise === null || prestation === null || teinte === null || piece === null
  ) {
    return fail("Vérifiez votre nom, votre téléphone et votre email avant de réessayer.", 400);
  }

  const files = data.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES || files.some((f) => f.size > MAX_FILE_SIZE || !f.type.startsWith("image/"))) {
    return fail("Photos : 5 images maximum, 5 Mo chacune.", 400);
  }

  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT);
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASSWORD;
  const from = process.env.CONTACT_FORM_FROM;
  const to = process.env.CONTACT_FORM_TO;
  if (!host || !Number.isInteger(port) || !user || !pass || !from || !to) {
    return fail("Le formulaire est temporairement indisponible. Merci de réessayer plus tard.", 500);
  }

  const photos = files.map((f, i) => ({ cid: `photo-${i}@retrocolor`, filename: f.name }));
  const { html, text } = renderQuoteEmail({ nom, entreprise, telephone, email, prestation, teinte, piece, receivedAt: new Date(), photos });

  try {
    const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    await transport.sendMail({
      from,
      to,
      replyTo: email,
      subject: `Demande de devis — ${nom.replace(/\s+/g, " ")}${prestation ? ` (${prestation.replace(/\s+/g, " ")})` : ""}`,
      text,
      html,
      attachments: await Promise.all(
        files.map(async (f, i) => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()), contentType: f.type, cid: photos[i].cid })),
      ),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] envoi SMTP échoué", error);
    return fail("L’envoi a échoué. Merci de réessayer plus tard ou d’appeler l’atelier.", 500);
  }
}
