"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCard } from "./actions";
import type { FormState } from "@/lib/types";

export default function CreateForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCard, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="stack">
      <div className="grid2">
        <label className="field">
          <span className="mono">Nombre</span>
          <input className="input" name="name" required maxLength={80} />
        </label>
        <label className="field">
          <span className="mono">Teléfono</span>
          <input className="input" name="phone" type="tel" maxLength={30} />
        </label>
        <label className="field">
          <span className="mono">Correo</span>
          <input className="input" name="email" type="email" required />
        </label>
        <label className="field">
          <span className="mono">Lanyard Nº</span>
          <input className="input" name="lanyard_no" maxLength={20} placeholder="Ej. 042" />
        </label>
      </div>
      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      {state.ok && <p className="notice ok" role="status" style={{ overflowWrap: "anywhere" }}>{state.message}</p>}
      <button className="btn light" type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear tarjeta y enviar link"}
      </button>
    </form>
  );
}
