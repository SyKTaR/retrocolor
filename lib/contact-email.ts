export type QuoteRequest = {
  nom: string;
  entreprise: string;
  telephone: string;
  email: string;
  prestation: string;
  teinte: string;
  piece: string;
  receivedAt: Date;
  photos: { cid: string; filename: string }[];
};

const BRAND = "#ea5b17";
const INK = "#1c1b19";
const MUTED = "#6e6d68";
const BORDER = "#ecebe8";
const PAGE = "#f3f2ef";
const FONT = "Helvetica Neue,Helvetica,Arial,sans-serif";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function formatReceivedAt(date: Date) {
  return `${date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "short" })} (Paris)`;
}

function row(label: string, value: string, html?: string) {
  const empty = !value;
  return `<tr><td style="padding:14px 0;border-top:1px solid ${BORDER};font-family:${FONT};">
    <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};padding-bottom:4px;">${label}</div>
    <div style="font-size:16px;line-height:1.4;color:${empty ? MUTED : INK};${empty ? "font-style:italic;" : "font-weight:600;"}">${empty ? "Non renseigné" : (html ?? escapeHtml(value))}</div>
  </td></tr>`;
}

export function renderQuoteEmail(q: QuoteRequest) {
  const subtitle = [q.entreprise, q.prestation].filter(Boolean).join(" · ");
  const received = formatReceivedAt(q.receivedAt);
  const mailLink = `mailto:${q.email}?subject=${encodeURIComponent("Votre demande de devis — Rétro Color")}`;

  const photos = q.photos.length
    ? `<tr><td style="padding:22px 0 0;border-top:1px solid ${BORDER};font-family:${FONT};">
        <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};padding-bottom:10px;">Photos de la pièce (${q.photos.length})</div>
        ${q.photos.map((p) => `<img src="cid:${p.cid}" alt="${escapeHtml(p.filename)}" width="248" style="display:inline-block;width:248px;max-width:100%;height:auto;border-radius:10px;border:1px solid ${BORDER};margin:0 6px 6px 0;" />`).join("")}
      </td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Nouvelle demande de devis</title></head>
<body style="margin:0;padding:0;background:${PAGE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(q.nom)}${subtitle ? ` — ${escapeHtml(subtitle)}` : ""} · ${escapeHtml(q.telephone)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAGE};"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
    <tr><td style="background:${INK};padding:26px 36px;font-family:${FONT};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td style="font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">Retro<span style="color:${BRAND};"> Color</span></td>
        <td align="right" style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#a5a49e;">Demande de devis</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${BRAND};">&nbsp;</td></tr>
    <tr><td style="padding:34px 36px 8px;font-family:${FONT};">
      <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${BRAND};font-weight:700;padding-bottom:10px;">Nouvelle demande</div>
      <div style="font-size:28px;line-height:1.15;font-weight:800;color:${INK};">${escapeHtml(q.nom)}</div>
      ${subtitle ? `<div style="font-size:15px;color:${MUTED};padding-top:6px;">${escapeHtml(subtitle)}</div>` : ""}
      <div style="font-size:13px;color:${MUTED};padding-top:10px;">Reçue le ${escapeHtml(received)}</div>
    </td></tr>
    <tr><td style="padding:22px 36px 6px;">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="background:${BRAND};border-radius:10px;"><a href="${mailLink}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Répondre par email</a></td>
        <td style="width:10px;">&nbsp;</td>
        <td style="border:1px solid ${INK};border-radius:10px;"><a href="${telHref(q.telephone)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:700;color:${INK};text-decoration:none;">Appeler</a></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:22px 36px 6px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${row("Téléphone", q.telephone, `<a href="${telHref(q.telephone)}" style="color:${INK};text-decoration:none;">${escapeHtml(q.telephone)}</a>`)}
        ${row("Email", q.email, `<a href="mailto:${escapeHtml(q.email)}" style="color:${INK};text-decoration:none;">${escapeHtml(q.email)}</a>`)}
        ${row("Entreprise", q.entreprise)}
        ${row("Prestation", q.prestation)}
        ${row("Teinte souhaitée", q.teinte)}
      </table>
    </td></tr>
    <tr><td style="padding:6px 36px 6px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:18px 0 0;border-top:1px solid ${BORDER};font-family:${FONT};">
        <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};padding-bottom:8px;">La pièce</div>
        <div style="background:${PAGE};border-radius:10px;padding:16px 18px;font-size:15px;line-height:1.6;color:${INK};${q.piece ? "" : `color:${MUTED};font-style:italic;`}">${q.piece ? escapeHtml(q.piece).replace(/\r?\n/g, "<br>") : "Aucune description."}</div>
      </td></tr></table>
    </td></tr>
    ${photos ? `<tr><td style="padding:18px 36px 6px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${photos}</table></td></tr>` : ""}
    <tr><td style="padding:28px 36px 30px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
      Envoyé depuis le formulaire du site Rétro Color. Répondre à ce message écrit directement à ${escapeHtml(q.nom)}.${q.photos.length ? " Les photos sont également téléchargeables en pièces jointes." : ""}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    "Nouvelle demande de devis — Rétro Color",
    "",
    `Nom : ${q.nom}`,
    `Entreprise : ${q.entreprise || "Non renseignée"}`,
    `Téléphone : ${q.telephone}`,
    `Email : ${q.email}`,
    `Prestation : ${q.prestation || "Non renseignée"}`,
    `Teinte souhaitée : ${q.teinte || "Non renseignée"}`,
    `Reçue le : ${received}`,
    q.photos.length ? `Photos jointes : ${q.photos.length}` : "",
    "",
    "Pièce :",
    q.piece || "Non renseignée",
  ].filter((line, i, all) => line || all[i - 1] !== "" ).join("\n");

  return { html, text };
}
