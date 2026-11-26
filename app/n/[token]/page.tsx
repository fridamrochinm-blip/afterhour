import type { Metadata } from "next";
import { getPublicCard } from "@/lib/cards";
import {
  DownloadIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
  Sparkle,
} from "@/app/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "After Hour", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function Welcome() {
  return (
    <div className="welcome">
      <Sparkle />
      <h2 className="serif" style={{ fontSize: 36, fontWeight: 400 }}>
        Welcome to the
        <br />
        After Hour.
      </h2>
      <p className="mono">A platform by founders, for founders.</p>
    </div>
  );
}

export default async function CardPage({ params }: Props) {
  const { token } = await params;
  const card = await getPublicCard(token);

  if (!card) {
    return (
      <main className="page center" style={{ justifyContent: "center" }}>
        <Sparkle size={34} />
        <h1 className="serif center-text" style={{ fontSize: 34 }}>
          Esta tarjeta no
          <br />
          está disponible.
        </h1>
        <p className="muted center-text" style={{ margin: 0 }}>
          Si es tu lanyard, contacta al equipo de After Hour.
        </p>
        <Welcome />
      </main>
    );
  }

  const subtitle = [card.title, card.company].filter(Boolean).join(" · ");
  const links: { href: string; label: string; value: string; icon: React.ReactNode; external?: boolean }[] = [];
  if (card.phone) links.push({ href: `tel:${card.phone.replace(/[^\d+]/g, "")}`, label: "Teléfono", value: card.phone, icon: <PhoneIcon /> });
  if (card.email) links.push({ href: `mailto:${card.email}`, label: "Correo", value: card.email, icon: <MailIcon /> });
  if (card.instagram) links.push({ href: `https://instagram.com/${card.instagram}`, label: "Instagram", value: `@${card.instagram}`, icon: <InstagramIcon />, external: true });
  if (card.linkedin) links.push({ href: card.linkedin, label: "LinkedIn", value: card.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), icon: <LinkedinIcon />, external: true });
  if (card.website) links.push({ href: card.website, label: "Sitio web", value: card.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), icon: <GlobeIcon />, external: true });

  return (
    <main className="page center">
      <div className="stack" style={{ alignItems: "center", gap: 18, marginTop: 12 }}>
        <div className="avatar">
          <div className="disc" aria-hidden="true" />
          <div className="photo">
            {card.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.photo_url} alt={`Foto de ${card.name}`} />
            ) : (
              <span className="initials" aria-hidden="true">{initials(card.name)}</span>
            )}
          </div>
          <Sparkle size={34} className="star" />
        </div>

        {card.lanyard_no && <p className="mono" style={{ marginTop: 6 }}>Member · Nº {card.lanyard_no}</p>}
        <h1 className="serif center-text" style={{ fontSize: 44 }}>{card.name}</h1>
        {subtitle && <p className="mono center-text" style={{ fontSize: 12, color: "var(--ink-2)" }}>{subtitle}</p>}
        {card.bio && <p className="muted center-text" style={{ margin: 0, fontSize: 15, lineHeight: 1.5, maxWidth: 320 }}>{card.bio}</p>}
      </div>

      <a href={`/n/${token}/vcard`} className="btn">
        <DownloadIcon />
        Guardar contacto
      </a>

      {links.length > 0 && (
        <nav className="links" aria-label="Contacto">
          {links.map((l) => (
            <a key={l.label} href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {l.icon}
              <span className="label">
                <span className="mono">{l.label}</span>
                <span className="value">{l.value}</span>
              </span>
            </a>
          ))}
        </nav>
      )}

      <Welcome />

      <a href="/login?next=/editar" className="mono" style={{ textDecoration: "underline", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
        ¿Es tu tarjeta? Edítala
      </a>
    </main>
  );
}
