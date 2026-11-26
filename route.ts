import { getPublicCard } from "@/lib/cards";

export const dynamic = "force-dynamic";

const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getPublicCard(token);
  if (!card) return new Response("No disponible", { status: 404 });

  const parts = card.name.trim().split(/\s+/);
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(card.name)}`,
  ];
  if (card.company) lines.push(`ORG:${esc(card.company)}`);
  if (card.title) lines.push(`TITLE:${esc(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${esc(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(card.email)}`);
  if (card.website) lines.push(`URL:${esc(card.website)}`);
  if (card.linkedin) lines.push(`URL;TYPE=LinkedIn:${esc(card.linkedin)}`);
  if (card.instagram) lines.push(`X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${esc(card.instagram)}`);
  lines.push(`NOTE:${esc("Conocidos en After Hour")}`, "END:VCARD");

  const filename = card.name.normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "contacto";
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
