import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicCard = {
  name: string;
  lanyard_no: string | null;
  title: string | null;
  company: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  linkedin: string | null;
  website: string | null;
  photo_url: string | null;
};

/**
 * Resuelve el token del chip a los datos que el miembro decidió mostrar.
 * Devuelve null si el token no existe o la tarjeta está desactivada
 * (misma respuesta en ambos casos, para no revelar cuál es).
 */
export async function getPublicCard(token: string): Promise<PublicCard | null> {
  if (!/^[A-Za-z0-9]{16,40}$/.test(token)) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("cards")
    .select("name, lanyard_no, title, company, bio, phone, email, instagram, linkedin, website, photo_url, show_phone, show_email, active")
    .eq("token", token)
    .maybeSingle();
  if (!data || !data.active) return null;
  return {
    name: data.name,
    lanyard_no: data.lanyard_no,
    title: data.title,
    company: data.company,
    bio: data.bio,
    phone: data.show_phone ? data.phone : null,
    email: data.show_email ? data.email : null,
    instagram: data.instagram,
    linkedin: data.linkedin,
    website: data.website,
    photo_url: data.photo_url,
  };
}
