import Link from "next/link";
import { Sparkle } from "./icons";

export default function Home() {
  return (
    <main className="page center" style={{ justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpg" alt="After Hour" className="logo" style={{ width: 280 }} />
      <div className="welcome">
        <Sparkle />
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 400 }}>
          Welcome to the
          <br />
          After Hour.
        </h1>
        <p className="mono">A platform by founders, for founders.</p>
      </div>
      <Link href="/login" className="btn outline">
        Soy miembro · Entrar
      </Link>
    </main>
  );
}
