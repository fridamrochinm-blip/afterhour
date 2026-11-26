"use client";

import { useActionState } from "react";
import { bulkActivate, deactivateAll, type BulkState } from "./actions";
import type { FormState } from "@/lib/types";

export default function BulkForm() {
  const [state, action, pending] = useActionState<BulkState, FormData>(bulkActivate, {});
  const [offState, offAction, offPending] = useActionState<FormState, FormData>(deactivateAll, {});

  return (
    <div className="stack" style={{ gap: 20 }}>
      <form action={action} className="stack">
        <label className="field">
          <span className="mono">Correos de quienes compraron este volumen</span>
          <textarea
            className="input"
            name="emails"
            rows={6}
            placeholder="Pega aquí los correos: uno por línea, separados por comas, o la lista completa copiada de la plataforma de boletos."
          />
        </label>
        <label className="check" style={{ color: "var(--cream)" }}>
          Desactivar las tarjetas que no estén en la lista
          <input type="checkbox" name="deactivate_others" defaultChecked style={{ accentColor: "var(--cream)" }} />
        </label>
        {state.error && <p className="notice err" role="alert">{state.error}</p>}
        {state.ok && (
          <div className="notice ok" role="status">
            {state.message}
            {state.missing && state.missing.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {state.missing.map((m) => <li key={m}>{m}</li>)}
              </ul>
            )}
          </div>
        )}
        <button className="btn light" type="submit" disabled={pending}>
          {pending ? "Aplicando…" : "Activar estas tarjetas"}
        </button>
      </form>

      <form action={offAction} className="stack" style={{ borderTop: "1px solid #3a3632", paddingTop: 16 }}>
        <label className="check" style={{ color: "var(--cream)" }}>
          Confirmo: desactivar TODAS las tarjetas (fin de volumen)
          <input type="checkbox" name="confirm" style={{ accentColor: "var(--cream)" }} />
        </label>
        {offState.error && <p className="notice err" role="alert">{offState.error}</p>}
        {offState.ok && <p className="notice ok" role="status">{offState.message}</p>}
        <button className="btn outline" type="submit" disabled={offPending}>
          {offPending ? "Desactivando…" : "Desactivar todas"}
        </button>
      </form>
    </div>
  );
}
