"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// Destino de los links de los correos con las plantillas por defecto de Supabase.
// - Invitaciones y links enviados por el admin llegan con #access_token (en el hash).
// - Links pedidos en /login llegan con ?code= (PKCE) o ?token_hash=; esos los resuelve /auth/confirm.
export default function AuthCallback() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const nextParam = url.searchParams.get("next") ?? "/editar";
    const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/editar";

    if (url.searchParams.get("code") || url.searchParams.get("token_hash")) {
      window.location.replace(`/auth/confirm${url.search}`);
      return;
    }

    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      setFailed(true);
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) setFailed(true);
      else window.location.replace(next);
    });
  }, []);

  return (
    <main className="page center" style={{ justifyContent: "center" }}>
      {failed ? (
        <>
          <h1 className="serif center-text" style={{ fontSize: 32 }}>El link expiró o ya se usó.</h1>
          <a className="btn" href="/login">Pedir uno nuevo</a>
        </>
      ) : (
        <p className="mono">Entrando…</p>
      )}
    </main>
  );
}
