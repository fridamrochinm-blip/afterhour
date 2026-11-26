"use client";

import { useActionState, useState } from "react";
import { updateCard } from "./actions";
import type { Card, FormState } from "@/lib/types";

export default function EditForm({ card }: { card: Card }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCard, {});
  const [preview, setPreview] = useState<string | null>(card.photo_url);
  const [bio, setBio] = useState(card.bio ?? "");

  return (
    <form action={action} className="stack">
      <div className="photo-row">
        <div className="thumb">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Tu foto" />
          ) : (
            <span className="mono">Foto</span>
          )}
        </div>
        <label className="btn outline small" style={{ cursor: "pointer" }}>
          {preview ? "Cambiar foto" : "Subir foto"}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>

      <label className="field">
        <span className="mono">Nombre</span>
        <input className="input" name="name" defaultValue={card.name} required maxLength={80} autoComplete="name" />
      </label>
      <label className="field">
        <span className="mono">Teléfono</span>
        <input className="input" name="phone" type="tel" defaultValue={card.phone ?? ""} maxLength={30} autoComplete="tel" />
      </label>
      <label className="field">
        <span className="mono">Correo · solo lo cambia el equipo</span>
        <input className="input" value={card.email} disabled readOnly />
      </label>
      <label className="field">
        <span className="mono">Puesto</span>
        <input className="input" name="title" defaultValue={card.title ?? ""} maxLength={80} placeholder="Ej. Fundadora" />
      </label>
      <label className="field">
        <span className="mono">Empresa o proyecto</span>
        <input className="input" name="company" defaultValue={card.company ?? ""} maxLength={80} />
      </label>
      <label className="field">
        <span className="mono">Bio · {bio.length}/160</span>
        <textarea className="input" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} />
      </label>
      <label className="field">
        <span className="mono">Instagram</span>
        <input className="input" name="instagram" defaultValue={card.instagram ? `@${card.instagram}` : ""} placeholder="@usuario" autoCapitalize="none" />
      </label>
      <label className="field">
        <span className="mono">LinkedIn</span>
        <input className="input" name="linkedin" defaultValue={card.linkedin ?? ""} placeholder="linkedin.com/in/usuario" autoCapitalize="none" inputMode="url" />
      </label>
      <label className="field">
        <span className="mono">Sitio web</span>
        <input className="input" name="website" defaultValue={card.website ?? ""} placeholder="tusitio.com" autoCapitalize="none" inputMode="url" />
      </label>

      <fieldset style={{ border: 0, padding: 0, margin: 0, borderTop: "1px solid var(--line)" }}>
        <legend className="mono" style={{ padding: "14px 0 4px" }}>Qué se muestra en tu tarjeta</legend>
        <label className="check">
          Mostrar teléfono
          <input type="checkbox" name="show_phone" defaultChecked={card.show_phone} />
        </label>
        <label className="check">
          Mostrar correo
          <input type="checkbox" name="show_email" defaultChecked={card.show_email} />
        </label>
      </fieldset>

      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      {state.ok && <p className="notice ok" role="status">{state.message}</p>}

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
