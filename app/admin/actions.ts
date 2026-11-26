"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clean, generateToken, isEmail, siteUrl } from "@/lib/util";
import type { FormState } from "@/lib/types";

/** Manda la invitación (usuario nuevo) o un link para entrar (si ya existe). */
async function sendAccessEmail(email: string, name: string): Promise<boolean> {
  const db = createAdminClient();
  const redirectTo = `${siteUrl()}/auth/callback?next=/editar`;
  const { error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo, data: { name } });
  if (!error) return true;
  // Ya existe la cuenta: mandar link mágico.
  const { error: otpErr } = await db.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  return !otpErr;
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
  const token = generateToken();
  const { error } = await db.from("cards").insert({ token, name, phone, email, lanyard_no: lanyard });

  if (error) {
    if (error.code === "23505") {
      return { error: error.message.includes("lanyard") ? "Ese número de lanyard ya está asignado." : "Ya existe una tarjeta con ese correo." };
    }
    return { error: "No se pudo crear la tarjeta." };
  }

  const sent = await sendAccessEmail(email, name);
  revalidatePath("/admin");
  return sent
    ? { ok: true, message: `Tarjeta creada. Le enviamos el link a ${email}. Graba en su chip: ${siteUrl()}/n/${token}` }
    : { ok: true, message: `Tarjeta creada, pero el correo no salió (revisa el SMTP en Supabase). Usa “Reenviar link”. Chip: ${siteUrl()}/n/${token}` };
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
  if (data) await sendAccessEmail(data.email, data.name);
  revalidatePath("/admin");
}
