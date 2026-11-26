"use server";

import { createClient } from "@/lib/supabase/server";
import { isEmail, siteUrl } from "@/lib/util";
import type { FormState } from "@/lib/types";

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/editar");
  if (!isEmail(email)) return { error: "Escribe un correo válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // sin registro abierto: solo correos que tú diste de alta
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent(next.startsWith("/") ? next : "/editar")}`,
    },
  });

  // Mismo mensaje exista o no el correo, para no revelar quién es miembro.
  if (error && error.status !== 400 && error.status !== 422) {
    return { error: "No pudimos enviar el correo. Intenta en unos minutos." };
  }
  return { ok: true, message: "Si tu correo está registrado, te enviamos un link para entrar. Revisa tu bandeja (y spam)." };
}
