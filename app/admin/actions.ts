"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clean, generateToken, isEmail, normalizeInstagram, normalizeUrl, siteUrl } from "@/lib/util";
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

export type BulkState = FormState & { missing?: string[] };

async function setActive(ids: string[], active: boolean) {
  const db = createAdminClient();
  for (let i = 0; i < ids.length; i += 200) {
    await db.from("cards").update({ active }).in("id", ids.slice(i, i + 200));
  }
}

/**
 * Cruce por volumen: pega los correos de quienes compraron (lista, CSV o texto
 * copiado de la plataforma de boletos). Activa esas tarjetas y, si se pide,
 * desactiva todas las demás. Devuelve los correos que todavía no tienen tarjeta.
 */
export async function bulkActivate(_prev: BulkState, formData: FormData): Promise<BulkState> {
  await requireAdmin();
  const raw = String(formData.get("emails") ?? "");
  const deactivateOthers = formData.get("deactivate_others") === "on";
  const emails = new Set((raw.match(/[^\s,;<>"'()]+@[^\s,;<>"'()]+\.[^\s,;<>"'()]+/g) ?? []).map((e) => e.toLowerCase()));
  if (emails.size === 0) return { error: "No encontré ningún correo en el texto." };

  const { data } = await createAdminClient().from("cards").select("id, email");
  const cards = data ?? [];
  const toActivate = cards.filter((c) => emails.has(c.email)).map((c) => c.id);
  const toDeactivate = deactivateOthers ? cards.filter((c) => !emails.has(c.email)).map((c) => c.id) : [];
  const known = new Set(cards.map((c) => c.email));
  const missing = [...emails].filter((e) => !known.has(e));

  await setActive(toActivate, true);
  await setActive(toDeactivate, false);
  revalidatePath("/admin");

  let message = `${toActivate.length} tarjeta(s) activadas.`;
  if (deactivateOthers) message += ` ${toDeactivate.length} desactivadas.`;
  if (missing.length) message += ` ${missing.length} correo(s) aún no tienen tarjeta:`;
  return { ok: true, message, missing };
}

export async function deactivateAll(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (formData.get("confirm") !== "on") return { error: "Marca la casilla para confirmar." };
  const { data } = await createAdminClient().from("cards").select("id").eq("active", true);
  const ids = (data ?? []).map((c) => c.id);
  await setActive(ids, false);
  revalidatePath("/admin");
  return { ok: true, message: `${ids.length} tarjeta(s) desactivadas. Sus datos y sus ligas siguen guardados.` };
}

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** El admin edita cualquier campo de una tarjeta, incluidos correo y lanyard. */
export async function adminUpdateCard(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const db = createAdminClient();
  const id = String(formData.get("id") ?? "");
  const { data: current } = await db.from("cards").select("id, email, user_id").eq("id", id).maybeSingle();
  if (!current) return { error: "No encontré esa tarjeta." };

  const name = clean(formData.get("name"), 80);
  if (!name) return { error: "El nombre no puede quedar vacío." };
  const email = (clean(formData.get("email"), 120) ?? "").toLowerCase();
  if (!isEmail(email)) return { error: "El correo no es válido." };

  const instagramRaw = clean(formData.get("instagram"), 80);
  const instagram = normalizeInstagram(instagramRaw);
  if (instagramRaw && !instagram) return { error: "Revisa el usuario de Instagram." };
  const linkedinRaw = clean(formData.get("linkedin"), 200);
  const linkedin = normalizeUrl(linkedinRaw);
  if (linkedinRaw && !linkedin) return { error: "Revisa el link de LinkedIn." };
  const websiteRaw = clean(formData.get("website"), 200);
  const website = normalizeUrl(websiteRaw);
  if (websiteRaw && !website) return { error: "Revisa el sitio web." };

  const update: Record<string, unknown> = {
    name,
    email,
    lanyard_no: clean(formData.get("lanyard_no"), 20),
    phone: clean(formData.get("phone"), 30),
    title: clean(formData.get("title"), 80),
    company: clean(formData.get("company"), 80),
    bio: clean(formData.get("bio"), 160),
    instagram,
    linkedin,
    website,
    show_phone: formData.get("show_phone") === "on",
    show_email: formData.get("show_email") === "on",
    active: formData.get("active") === "on",
  };

  // Si cambia el correo, también cambia el correo con el que entra a editar.
  if (email !== current.email) {
    if (current.user_id) {
      const { error } = await db.auth.admin.updateUserById(current.user_id, { email, email_confirm: true });
      if (error) return { error: "Ese correo ya lo usa otra cuenta." };
    } else {
      const account = await ensureAccount(email, name);
      if (account.error) return { error: account.error };
      if (account.id) update.user_id = account.id;
    }
  }

  if (formData.get("remove_photo") === "on") update.photo_url = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return { error: "La foto debe ser JPG, PNG o WEBP." };
    if (photo.size > 4 * 1024 * 1024) return { error: "La foto pesa más de 4 MB." };
    const path = `${current.user_id ?? `admin-${id}`}/${Date.now()}.${ext}`;
    const { error: upErr } = await db.storage.from("photos").upload(path, photo, { contentType: photo.type });
    if (upErr) return { error: "No se pudo subir la foto." };
    update.photo_url = db.storage.from("photos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await db.from("cards").update(update).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { error: error.message.includes("lanyard") ? "Ese número de lanyard ya está asignado." : "Ya existe una tarjeta con ese correo." };
    }
    return { error: "No se pudo guardar." };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/miembro/${id}`);
  return { ok: true, message: "Cambios guardados." };
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
