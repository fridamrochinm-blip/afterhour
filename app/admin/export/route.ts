import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/util";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Evita que Excel interprete fórmulas y escapa comillas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("cards")
    .select("lanyard_no, name, email, phone, active, token, created_at")
    .order("lanyard_no", { ascending: true, nullsFirst: false });

  const base = siteUrl();
  const rows = [
    ["Lanyard", "Nombre", "Correo", "Teléfono", "Estado", "URL del chip", "Creada"],
    ...(data ?? []).map((c) => [
      c.lanyard_no,
      c.name,
      c.email,
      c.phone,
      c.active ? "Activa" : "Desactivada",
      `${base}/n/${c.token}`,
      new Date(c.created_at).toLocaleDateString("es-MX", { timeZone: "America/Tijuana" }),
    ]),
  ];
  // BOM para que Excel lea bien los acentos
  const csv = "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="after-hour-tarjetas-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
