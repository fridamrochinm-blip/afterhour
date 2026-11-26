"use client";

import { useActionState, useState } from "react";
import { adminUpdateCard } from "../../actions";
import type { Card, FormState } from "@/lib/types";

function Field(props: { label: string; name: string; defaultValue?: string | null; type?: string; required?: boolean; max?: number; placeholder?: string }) {
  return (
    <label className="field">
      <span className="mono">{props.label}</span>
      <input
        className="input"
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.defaultValue ?? ""}
        required={props.required}
        maxLength={props.max}
        placeholder={props.placeholder}
        autoCapitalize={props.type === "email" ? "none" : undefined}
      />
    </label>
  );
}

export default function AdminEditForm({ card }: { card: Card }) {
  const [state, action, pending] = useActionState<FormState, FormData>(adminUpdateCard, {});
  const [preview, setPreview] = useState<string | null>(card.photo_url);
  const [bio, setBio] = useState(card.bio ?? "");

  return (
    <form action={action} className="stack">
      <input type="hidden" name="id" value={card.id} />

      <div className="photo-row">
        <div className="thumb">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`Foto de ${card.name}`} />
          ) : (
            <span className="mono">Foto</span>
          )}
        </div>
        <label className="btn outline small" style={{ cursor: "pointer", position: "relative" }}>
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
      {card.photo_url && (
        <label className="check" style={{ color: "var(--cream)" }}>
          Quitar foto
          <input type="checkbox" name="remove_photo" style={{ accentColor: "var(--cream)" }} />
        </label>
      )}

      <div className="grid2">
        <Field label="Nombre" name="name" defaultValue={card.name} required max={80} />
        <Field label="Lanyard Nº" name="lanyard_no" defaultValue={card.lanyard_no} max={20} />
        <Field label="Correo (con el que entra)" name="email" type="email" defaultValue={card.email} required />
        <Field label="Teléfono" name="phone" type="tel" defaultValue={card.phone} max={30} />
        <Field label="Puesto" name="title" defaultValue={card.title} max={80} />
        <Field label="Empresa o proyecto" name="company" defaultValue={card.company} max={80} />
      </div>

      <label className="field">
        <span className="mono">Bio · {bio.length}/160</span>
        <textarea className="input" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} />
      </label>

      <div className="grid2">
        <Field label="Instagram" name="instagram" defaultValue={card.instagram ? `@${card.instagram}` : ""} placeholder="@usuario" />
        <Field label="LinkedIn" name="linkedin" defaultValue={card.linkedin} placeholder="linkedin.com/in/usuario" />
        <Field label="Sitio web" name="website" defaultValue={card.website} placeholder="sitio.com" />
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0, borderTop: "1px solid #3a3632" }}>
        <legend className="mono" style={{ padding: "14px 0 4px" }}>Visibilidad y estado</legend>
        <label className="check" style={{ color: "var(--cream)" }}>
          Mostrar teléfono
          <input type="checkbox" name="show_phone" defaultChecked={card.show_phone} style={{ accentColor: "var(--cream)" }} />
        </label>
        <label className="check" style={{ color: "var(--cream)" }}>
          Mostrar correo
          <input type="checkbox" name="show_email" defaultChecked={card.show_email} style={{ accentColor: "var(--cream)" }} />
        </label>
        <label className="check" style={{ color: "var(--cream)" }}>
          Tarjeta activa
          <input type="checkbox" name="active" defaultChecked={card.active} style={{ accentColor: "var(--cream)" }} />
        </label>
      </fieldset>

      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      {state.ok && <p className="notice ok" role="status">{state.message}</p>}

      <button className="btn light" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
