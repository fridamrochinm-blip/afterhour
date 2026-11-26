# After Hour · Tarjetas digitales NFC

Cada lanyard abre la tarjeta de su dueño. Tú das de alta a la persona (nombre, teléfono, correo, Nº de lanyard); ella recibe un link por correo y edita su foto, bio, puesto, empresa y redes. Sin contraseñas y sin registro abierto.

| Ruta | Qué es |
|---|---|
| `/n/[token]` | La tarjeta pública (lo que abre el chip) |
| `/n/[token]/vcard` | Descarga "Guardar contacto" |
| `/login` | Pedir link para entrar |
| `/editar` | El miembro edita su tarjeta |
| `/admin` | Alta de miembros, URL de cada chip, reenviar link, desactivar |

Stack: Next.js 15 · Supabase (base de datos, login por correo, fotos) · Vercel.

---

## Puesta en marcha (≈30 min, una sola vez)

### 1. Supabase
1. Crea una cuenta en supabase.com → **New project** (región: la más cercana, p. ej. West US). Plan Pro recomendado para producción: el gratuito se pausa tras 7 días sin uso y el lanyard dejaría de abrir.
2. **SQL Editor → New query** → pega todo `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers → Email**: deja Email activado. En **Authentication → Settings** desactiva **Allow new users to sign up** (tus invitaciones siguen funcionando).
4. **Authentication → URL Configuration**:
   - Site URL: la dirección de tu sitio (primero la de Vercel, luego `https://afterhourmx.com`).
   - Redirect URLs: agrega `https://TU-SITIO/**` (y `http://localhost:3000/auth/confirm` si pruebas local).
5. *(Opcional; Supabase solo lo permite con SMTP propio.)* Las plantillas por defecto ya funcionan con `/auth/callback`. Si quieres traducirlas, en **Authentication → Emails → Templates** usa estos links:
   - **Invite user**:
     ```html
     <h2>Bienvenido a After Hour</h2>
     <p>Ya tienes tu lanyard. Completa tu tarjeta aquí:</p>
     <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/editar">Editar mi tarjeta</a></p>
     ```
   - **Magic Link**:
     ```html
     <h2>Entra a tu tarjeta</h2>
     <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/editar">Entrar</a></p>
     ```
6. **Correo propio (importante):** el envío incluido en Supabase solo manda unos pocos correos por hora y es para pruebas. Antes de dar de alta a mucha gente, conecta un SMTP en **Authentication → Emails → SMTP Settings** (por ejemplo Resend, con tu dominio verificado).
7. **Project Settings → API**: copia `Project URL`, `anon key` y `service_role key`.

### 2. Vercel
1. Sube esta carpeta a un repositorio de GitHub (privado).
2. vercel.com → **Add New → Project** → importa el repo.
3. En **Environment Variables** agrega las de `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = la URL que te dé Vercel (sin `/` al final)
4. **Deploy**. Vuelve a Supabase y pon esa URL en Site URL / Redirect URLs (paso 1.4).

### 3. Hazte administradora
1. Supabase → **Authentication → Users → Add user → Send invitation** con tu correo.
2. SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'TU@CORREO.com';
   ```
3. Abre el link del correo (o ve a `/login`) → entra → `/admin`.
   Si también quieres tu propia tarjeta, date de alta en `/admin` con tu mismo correo.

---

## Operación diaria

1. Entregas el lanyard → en `/admin` capturas nombre, teléfono, correo y Nº de lanyard → **Crear tarjeta y enviar link**.
2. Copias la **URL del chip** que aparece y la grabas en el NFC (app gratuita *NFC Tools* en iPhone/Android → Escribir → Agregar registro → URL).
3. La persona abre su correo → edita su tarjeta. Si pierde el correo: **Reenviar link**, o ella misma lo pide en `/login`.
4. Lanyard perdido o persona dada de baja → **Desactivar**: el chip muestra "Esta tarjeta no está disponible" sin datos.

## Antes de grabar los 200 chips

- Compra **afterhourmx.com**, agrégalo en Vercel (**Settings → Domains**), cambia `NEXT_PUBLIC_SITE_URL` a `https://afterhourmx.com`, redeploy, y actualiza Site URL / Redirect URLs en Supabase.
- Las tarjetas creadas antes del cambio de dominio conservan su token: solo cambia el dominio de la URL que grabas.
- Prueba 2–3 chips en iPhone y Android. **Bloquea (lock) los chips solo cuando todo funcione**: un chip bloqueado no se puede regrabar.

## Seguridad (qué está resuelto)

- No hay registro público: solo entran correos que tú diste de alta.
- Cada miembro solo puede leer y editar su propia tarjeta (Row Level Security). Correo, Nº de lanyard, token y estatus están bloqueados a nivel base de datos.
- Tokens de 20 caracteres aleatorios: no se pueden adivinar ni recorrer.
- El chip solo guarda una URL, nunca datos personales. Tarjetas desactivadas o tokens inexistentes muestran la misma pantalla neutra.
- La `service_role key` solo se usa en el servidor.

## Pendiente / ideas siguientes
- Cambiar el correo de un miembro desde el panel (hoy: editar en Supabase → Table Editor → cards y en Authentication → Users).
- Aviso de privacidad (LFPDPPP) enlazado en la tarjeta.

## Desarrollo local
```bash
cp .env.example .env.local   # llena los valores
npm install
npm run dev                  # http://localhost:3000
```
