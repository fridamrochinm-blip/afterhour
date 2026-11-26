import Link from "next/link";
import LoginForm from "./LoginForm";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/editar";

  return (
    <main className="page">
      <div className="topbar">
        <Link href="/">← After Hour</Link>
      </div>
      <h1 className="serif" style={{ fontSize: 40 }}>
        Entra a tu
        <br />
        tarjeta.
      </h1>
      <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
        Sin contraseña: te mandamos un link a tu correo. Solo funciona con el correo que registró el equipo de After Hour.
      </p>
      {error && <p className="notice err" role="alert">El link expiró o ya se usó. Pide uno nuevo.</p>}
      <LoginForm next={safeNext} />
    </main>
  );
}
