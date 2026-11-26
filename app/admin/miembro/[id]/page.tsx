import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/util";
import { Sparkle } from "@/app/icons";
import type { Card } from "@/lib/types";
import CopyButton from "../../CopyButton";
import AdminEditForm from "./AdminEditForm";

export const dynamic = "force-dynamic";

export default async function AdminMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await createAdminClient().from("cards").select("*").eq("id", id).maybeSingle<Card>();
  if (!data) notFound();
  const url = `${siteUrl()}/n/${data.token}`;

  return (
    <main className="page dark">
      <div className="inner">
        <div className="topbar">
          <Link href="/admin">← Admin</Link>
          <Sparkle size={20} />
        </div>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 400 }}>{data.name}</h1>
        <div className="actions" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <CopyButton text={url} label="Copiar URL del chip" />
          <a href={`/n/${data.token}`} target="_blank" rel="noopener noreferrer"><code>{url}</code></a>
        </div>
        <AdminEditForm card={data} />
      </div>
    </main>
  );
}
