"use client";

import { useEffect } from "react";

// Si Supabase regresa a cualquier página con la sesión en el hash (#access_token=...),
// la manda a /auth/callback para guardarla. Pasa cuando la URL de regreso no está
// en la lista permitida de Supabase y cae en la Site URL.
export default function HashSession() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (pathname !== "/auth/callback" && hash.includes("access_token=")) {
      window.location.replace(`/auth/callback?next=/editar${hash}`);
    }
  }, []);
  return null;
}
