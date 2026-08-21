# Mexillum CRM

CRM de pipeline comercial para soluciones de energía (SFV / BESS).
Herramienta personal de un solo usuario, multi-dispositivo.

La especificación completa vive en [`PRD.md`](./PRD.md).

## Stack

| Capa | Herramienta |
|---|---|
| App | Vite + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Ruteo | React Router |
| Datos | Convex (tiempo real) |
| Login | Convex Auth (correo + contraseña, sin registro público) |
| Hosting | Cloudflare Pages |

## Estructura

```
convex/          Backend: schema, queries, mutations, auth, seed
docs/            Prototipo original y PRD v1 (referencia histórica)
public/          Estáticos + _redirects (SPA fallback de Cloudflare)
src/             Front: componentes, páginas, tema
PRD.md           Especificación vigente (v2)
```

## Arranque (primera vez)

Estos tres pasos requieren tus cuentas personales.

### 1. Convex

```bash
npx convex dev
```

Inicia sesión, crea el proyecto y genera `convex/_generated/`.
Déjalo corriendo: sincroniza el backend mientras trabajas.

### 1b. Claves de firma de sesión

**Obligatorio.** Sin esto el login falla con
`Missing environment variable JWT_PRIVATE_KEY`, después de haber creado
la cuenta — parece un problema de contraseña y no lo es.

```bash
npx @convex-dev/auth --web-server-url http://localhost:5173
```

Genera `JWT_PRIVATE_KEY` y `JWKS` en el despliegue. Hay que repetirlo
en producción, con la URL real:

```bash
npx @convex-dev/auth --prod --web-server-url https://tu-dominio
```

### 2. Tu cuenta de usuario

El registro público está **cerrado** a propósito (PRD §10), pero la
pantalla de acceso se ocupa sola: mientras la base no tenga ninguna
cuenta, ofrece **Crear cuenta**. Entras una vez, y a partir de ahí solo
ofrece **Entrar**.

No hay que tocar ninguna variable de entorno.

¿Perdiste el acceso? Cambia la contraseña sin borrar nada:

```bash
npx convex run cuenta:cambiarContrasena '{"email":"tu@correo.mx","nueva":"otra-contrasena"}'
```

### 3. La app

```bash
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila TypeScript y empaqueta a `dist/` |
| `npm run lint` | oxlint |
| `npx convex dev` | Backend en vivo + genera tipos |
| `npx convex run cuenta:cambiarContrasena '{"email":"…","nueva":"…"}'` | Cambia tu contraseña |
| `npx convex run seed:cargarDemo` | Carga datos de ejemplo |
| `npx convex run seed:borrarTodo` | Borra todos los datos de negocio |

## Despliegue

Cloudflare Pages, conectado al repositorio de GitHub.

- Build command: `npm run build`
- Output directory: `dist`
- Variable de entorno: `VITE_CONVEX_URL` (la da `npx convex deploy`)

`public/_redirects` ya contiene el fallback de SPA que React Router
necesita para que refrescar en `/leads/abc` no dé 404.
