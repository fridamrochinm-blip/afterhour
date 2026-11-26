"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clean, generateToken, isEmail, siteUrl } from "@/lib/util";
import type { FormState } from "@/lib/types";

/**
 * Crea la cuenta del miembro SIN mandar correo. Así puede entrar más tarde
 * desde "¿Es tu tarjeta? Edítala" (el login no permite cuentas nuevas).
 * Devuelve el id del usuario si se creó, null si ya existía.
 */
async function ensureAccount(email: string, name: string): Promise<{ id: string | null; error?: string }> {
  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name },
  });
  if (!error) return { id: data.user?.id ?? null };
  if (error.status === 422 || /already|exists|registered/i.test(error.message)) return { id: null };
  return { id: null, error: "No se pudo crear la cuenta de acceso." };
}

/** Manda al miembro un link para entrar a editar su tarjeta. */
async function sendAccessEmail(email: string): Promise<boolean> {
  const db = createAdminClient();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback?next=/editar` },
  });
  return !error;
}

export async function createCard(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const name = clean(formData.get("name"), 80);
  const phone = clean(formData.get("phone"), 30);
  const email = (clean(formData.get("email"), 120) ?? "").toLowerCase();
  const lanyard = clean(formData.get("lanyard_no"), 20);

  if (!name) return { error: "Falta el nombre." };
  if (!isEmail(email)) return { error: "El correo no es válido." };

  const db = createAdminClient();
  const { data: dup } = await db.from("cards").select("id").eq("email", email).maybeSingle();
  if (dup) return { error: "Ya existe una tarjeta con ese correo." };

  const account = await ensureAccount(email, name);
  if (account.error) return { error: account.error };

  const token = generateToken();
  const { error } = await db
    .from("cards")
    .insert({ token, name, phone, email, lanyard_no: lanyard, user_id: account.id });

  if (error) {
    if (error.code === "23505") {
      return { error: error.message.includes("lanyard") ? "Ese número de lanyard ya está asignado." : "Ya existe una tarjeta con ese correo." };
    }
    return { error: "No se pudo crear la tarjeta." };
  }

  revalidatePath("/admin");
  return { ok: true, message: `Tarjeta creada para ${name}. URL para su chip: ${siteUrl()}/n/${token}` };
}

export async function toggleActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  await createAdminClient().from("cards").update({ active: !active }).eq("id", id);
  revalidatePath("/admin");
}

export async function resendLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const { data } = await createAdminClient().from("cards").select("email, name").eq("id", id).maybeSingle();
  if (data) {
    await ensureAccount(data.email, data.name);
    await sendAccessEmail(data.email);
  }
  revalidatePath("/admin");
}
