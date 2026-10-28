"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/lib/content";
import { useCookieConsent } from "./cookie-consent";

function Field({ id, label, placeholder, type = "text", required = false, autoComplete, inputMode }: { id: string; label: string; placeholder: string; type?: string; required?: boolean; autoComplete?: string; inputMode?: "text" | "tel" | "email" }) {
  return <div className="form-field"><label htmlFor={id} className="form-label">{label}{required && <> <span className="form-required">*</span></>}</label><input className="form-input" maxLength={256} name={id} placeholder={placeholder} type={type} id={id} required={required} autoComplete={autoComplete} inputMode={inputMode} enterKeyHint="next" /></div>;
}

export function Contact() {
  const { consent, allowExternal } = useCookieConsent();
  const [files, setFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true); setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", body: new FormData(event.currentTarget) });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) setSuccess(true); else setError(json?.error ?? "L’envoi a échoué. Merci de réessayer.");
    } catch { setError("L’envoi a échoué. Vérifiez votre connexion et réessayez."); }
    finally { setSending(false); }
  };
  return <section id="contact" className="section contact"><div className="container contact-inner">
    <div className="contact-info"><div className="contact-head"><h2 data-split="lines" className="heading-l">Demander<br />un devis</h2><p data-blur className="text-lead">Décrivez votre pièce et joignez une photo si possible. Nous revenons vers vous avec un prix et un délai.</p></div>
      <div data-anim="fade-up" className="contact-details"><div className="contact-block"><a href={site.phoneHref} className="contact-phone">{site.phone}</a><a href={site.emailHref} className="contact-email">{site.email}</a></div><div className="contact-block is-row"><div className="contact-col"><span className="contact-label">Atelier</span><span className="contact-value">{site.address[0]}<br />{site.address[1]}</span></div><div className="contact-col"><span className="contact-label">Horaires</span><span className="contact-value">{site.hours[0]}<br />{site.hours[1]}</span></div></div></div>
      <div data-anim="reveal" className="media-placeholder is-map">{consent?.external ? <iframe className="map-frame" title="Plan d’accès à l’atelier Rétro Color, 17 rue Louis Armand, Ozoir-la-Ferrière" src={`https://maps.google.com/maps?q=${encodeURIComponent(`${site.address[0]}, ${site.address[1]}`)}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /> : <div className="map-consent"><p>La carte Google Maps nécessite votre accord pour les contenus externes.</p><button type="button" onClick={allowExternal}>Afficher la carte</button></div>}</div>
    </div>
    <div data-anim="fade-up" className="quote-card"><div className="quote-card-head"><span className="quote-card-title">Votre demande</span><span className="quote-card-note">Les champs marqués d’un astérisque sont obligatoires.</span></div>
      {success ? <div className="form-message" role="status"><strong>Demande envoyée.</strong><br />Merci, nous revenons vers vous avec un prix et un délai. Une urgence ? Appelez l’atelier au <a href={site.phoneHref}>{site.phone}</a>.</div> :
        <form className="quote-form" onSubmit={submit}>
          <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}><label htmlFor="site_web">Site web</label><input id="site_web" name="site_web" type="text" tabIndex={-1} autoComplete="off" /></div>
          <div className="form-row"><Field id="nom" label="Nom" placeholder="Votre nom" required autoComplete="name" /><Field id="entreprise" label="Entreprise" placeholder="Facultatif" autoComplete="organization" /></div>
          <div className="form-row"><Field id="telephone" label="Téléphone" placeholder="06 00 00 00 00" type="tel" required autoComplete="tel" inputMode="tel" /><Field id="email" label="Email" placeholder="vous@exemple.fr" type="email" required autoComplete="email" inputMode="email" /></div>
          <div className="form-row"><Field id="prestation" label="Prestation" placeholder="Poudre, liquide, sablage…" /><Field id="teinte" label="Teinte souhaitée" placeholder="RAL 7016" /></div>
          <div className="form-field"><label htmlFor="piece" className="form-label is-dark">Votre pièce</label><textarea id="piece" name="piece" className="form-input is-textarea" placeholder="Matière, dimensions, quantité, état actuel" maxLength={5000} /></div>
          <div className="file-field"><span>Photos de la pièce</span><input id="photos" name="photos" type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /><label htmlFor="photos" className="file-button">Ajouter des fichiers</label><span className="file-list" aria-live="polite">{files.map((file) => file.name).join(", ")}</span></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button is-xl is-full" disabled={sending}>{sending ? "Envoi en cours…" : "Envoyer la demande"}</button>
        </form>}
    </div>
  </div></section>;
}
