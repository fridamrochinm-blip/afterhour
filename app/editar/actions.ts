"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { clean, normalizeInstagram, normalizeUrl } from "@/lib/util";
import type { FormState } from "@/lib/types";

const MAX_PHOTO = 4 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function updateCard(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const name = clean(formData.get("name"), 80);
  if (!name) return { error: "Tu nombre no puede quedar vacío." };

  const instagramRaw = clean(formData.get("instagram"), 80);
  const instagram = normalizeInstagram(instagramRaw);
  if (instagramRaw && !instagram) return { error: "Revisa tu usuario de Instagram." };

  const linkedinRaw = clean(formData.get("linkedin"), 200);
  const linkedin = normalizeUrl(linkedinRaw);
  if (linkedinRaw && !linkedin) return { error: "Revisa tu link de LinkedIn." };

  const websiteRaw = clean(formData.get("website"), 200);
  const website = normalizeUrl(websiteRaw);
  if (websiteRaw && !website) return { error: "Revisa tu sitio web." };

  const update: Record<string, unknown> = {
    name,
    phone: clean(formData.get("phone"), 30),
    title: clean(formData.get("title"), 80),
    company: clean(formData.get("company"), 80),
    bio: clean(formData.get("bio"), 160),
    instagram,
    linkedin,
    website,
    show_phone: formData.get("show_phone") === "on",
    show_email: formData.get("show_email") === "on",
  };

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return { error: "La foto debe ser JPG, PNG o WEBP." };
    if (photo.size > MAX_PHOTO) return { error: "La foto pesa más de 4 MB." };
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("photos").upload(path, photo, { contentType: photo.type, upsert: false });
    if (upErr) return { error: "No pudimos subir la foto. Intenta con otra." };
    update.photo_url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
  }

  // RLS solo deja actualizar la tarjeta propia; el trigger bloquea correo, token y estatus.
  const { error } = await supabase.from("cards").update(update).eq("user_id", user.id);
  if (error) return { error: "No pudimos guardar. Intenta de nuevo." };

  revalidatePath("/editar");
  return { ok: true, message: "Listo, tu tarjeta está actualizada." };
}
