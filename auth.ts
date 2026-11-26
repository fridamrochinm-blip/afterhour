import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function isAdmin(): Promise<boolean> {
  const { supabase, user } = await getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

/** Corta la ejecución si quien llama no es admin. Usar en cada acción de admin. */
export async function requireAdmin() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/admin");
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/");
  return user;
}
