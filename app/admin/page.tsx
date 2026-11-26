import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/util";
import { Sparkle } from "@/app/icons";
import type { Card } from "@/lib/types";
import CreateForm from "./CreateForm";
import { resendLink, toggleActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });
  const cards = (data ?? []) as Card[];
  const base = siteUrl();

  return (
    <main className="page dark">
      <div className="inner">
        <div className="topbar">
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkle size={20} />
            <span className="mono">After Hour · Admin</span>
          </span>
          <Link href="/editar">Mi tarjeta</Link>
        </div>

        <h1 className="serif" style={{ fontSize: 40, fontWeight: 400 }}>Nuevo miembro.</h1>
        <CreateForm />

        <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginTop: 16 }}>
          Miembros · {cards.length}
        </h2>

        {cards.length === 0 ? (
          <p className="mono">Todavía no hay tarjetas.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>LANYARD</th>
                  <th>NOMBRE</th>
                  <th>CORREO</th>
                  <th>ESTADO</th>
                  <th>URL DEL CHIP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id}>
                    <td>{c.lanyard_no ?? "—"}</td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <span className="pill" style={{ color: c.active ? "#b9d7a8" : "#f6a3a3" }}>
                        {c.active ? "ACTIVA" : "DESACTIVADA"}
                      </span>
                    </td>
                    <td>
                      <a href={`/n/${c.token}`} target="_blank" rel="noopener noreferrer"><code>{`${base}/n/${c.token}`}</code></a>
                    </td>
                    <td>
                      <div className="actions">
                        <form action={resendLink}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit">Mandar link</button>
                        </form>
                        <form action={toggleActive}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="active" value={String(c.active)} />
                          <button type="submit">{c.active ? "Desactivar" : "Activar"}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
