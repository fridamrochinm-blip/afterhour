"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";
import type { FormState } from "@/lib/types";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMagicLink, {});

  if (state.ok) return <p className="notice ok" role="status">{state.message}</p>;

  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span className="mono">Tu correo</span>
        <input className="input" type="email" name="email" required autoComplete="email" inputMode="email" />
      </label>
      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviarme link para entrar"}
      </button>
    </form>
  );
}
