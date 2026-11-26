import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Sparkle } from "@/app/icons";
import type { Card } from "@/lib/types";
import EditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditPage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/editar");

  let { data: card } = await supabase.from("cards").select("*").eq("user_id", user.id).maybeSingle<Card>();

  // Primer ingreso: liga la tarjeta que el admin creó con este correo.
  if (!card && user.email) {
    await createAdminClient()
      .from("cards")
      .update({ user_id: user.id })
      .eq("email", user.email.toLowerCase())
      .is("user_id", null);
    ({ data: card } = await supabase.from("cards").select("*").eq("user_id", user.id).maybeSingle<Card>());
  }

  const admin = await isAdmin();

  return (
    <main className="page">
      <div className="topbar">
        {card ? <Link href={`/n/${card.token}`}>← Ver mi tarjeta</Link> : <Link href="/">← After Hour</Link>}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {admin && <Link href="/admin">Admin</Link>}
          <form action="/auth/signout" method="post">
            <button className="linkbtn" type="submit">Salir</button>
          </form>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h1 className="serif" style={{ fontSize: 38 }}>
          Tu tarjeta,
          <br />
          tus reglas.
        </h1>
        <Sparkle size={24} />
      </div>

      {card ? (
        <>
          {!card.active && (
            <p className="notice err">
              Tu tarjeta está pausada: tu lanyard se activa en cada volumen de After Hour al que asistas. Puedes seguir editándola.
            </p>
          )}
          <EditForm card={card} />
        </>
      ) : (
        <p className="notice err">
          No encontramos una tarjeta ligada a {user.email}. Si ya tienes tu lanyard, pide al equipo que revise tu correo.
        </p>
      )}
    </main>
  );
}
