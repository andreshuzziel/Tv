# 🛠️ GUIA-IMPLEMENTACION — GitHub + tokens (lectura en la TV / actualización del sistema)

Arquitectura:

```
[Fuentes públicas: iptv-org, m3u.cl, Alplox, Free-TV, IPTV-SV…]
        │  (cada día, GitHub Actions — cron 06:00 UTC)
        ▼  scripts/actualizar.sh  →  scripts/sanitizar.py (reglas anti-hackeo)
[Repositorio GitHub "tv-chile"]  ──raw.githubusercontent.com──▶  [App IPTV en la TV]
        ▲                                                              (token de LECTURA solo si el repo es privado)
        └── push automático con token de ACTUALIZACIÓN (secreto, nunca en el repo)
```

El repo solo contiene playlists **sanitizadas** (https, sin TV de pago, sin URLs riesgosas) + la app web + guías. **No contiene ningún secreto.**

---

## 🔑 Token 1 — LECTURA (para ver la lista en la TV)

**Solo necesario si el repo es PRIVADO.** Si el repo es **público**, la TV lee la lista sin token:

```
https://raw.githubusercontent.com/TU-USUARIO/tv-chile/main/playlists/tv-chile-todo.m3u
```

Si lo haces privado, crea un **Fine-grained PAT** (los tokens clásicos están deprecados):

1. GitHub → tu avatar → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Repository access:** *Only select repositories* → `TU-USUARIO/tv-chile`
3. **Permissions:** *Repository permissions* → **Contents: Read-only**
4. **Expiration:** 90 días (máx. recomendado; luego rotar)
5. Copia el token UNA vez (empieza con `github_pat_…`)

Uso en la TV (URL con token, formato basic-auth):

```
https://x-access-token:github_pat_XXXX@raw.githubusercontent.com/TU-USUARIO/tv-chile/main/playlists/tv-chile-todo.m3u
```

- En **TiviMate / IPTV Smarters / OTT Navigator**: pega la URL tal cual en "añadir playlist por URL" (las que soportan auth en la URL la usarán sola).
- ⚠️ Ese token en la URL queda guardado en la config de la app de la TV: usa solo el token **Read-only** y revócalo si se filtra.

## 🔑 Token 2 — ACTUALIZACIÓN (para mejorar el sistema desde aquí/CI)

**Opción recomendada (sin crear PAT): usar el `GITHUB_TOKEN` automático de GitHub Actions.**
Ya está incluido: `.github/workflows/actualizar.yml` corre diario (`cron 06:00 UTC`) y manual (*Actions → actualizar-playlists → Run workflow*), con `permissions: contents: write`, ejecuta `scripts/actualizar.sh` (descarga → sanitiza → regenera playlists numeradas → commit+push si hay cambios). No hay que guardar ningún token.

**Opción alternativa (actualizar desde tu PC con un PAT propio):**

1. Fine-grained PAT igual que arriba, pero **Contents: Read and write** sobre `tv-chile`.
2. Guárdalo SOLO en:
   - **GitHub Actions:** *Settings → Secrets and variables → Actions → New secret* → nombre `UPDATE_TOKEN` (el workflow ya lo lee como `secrets.UPDATE_TOKEN`), **o**
   - **tu máquina local:** `~/.git-credentials` o `gh auth login` (gh CLI) — **nunca dentro del repo**.
3. Push manual:
   ```bash
   git remote set-url origin https://x-access-token:$UPDATE_TOKEN@github.com/TU-USUARIO/tv-chile.git
   git push origin main
   ```

## 🚀 Pasos rápidos (checklist)

1. Crear repo público `tv-chile` en GitHub (vacío).
2. Desde esta carpeta: `git remote add origin https://github.com/TU-USUARIO/tv-chile.git && git branch -M main && git push -u origin main`.
3. En la TV: app IPTV → añadir playlist por URL → `https://raw.githubusercontent.com/TU-USUARIO/tv-chile/main/playlists/tv-chile-todo.m3u` (3.110 canales numerados con `tvg-chno`; ver **GUIA-ORDEN.md**).
4. En GitHub → *Actions* → habilitar workflows → probar "actualizar-playlists" manual.
5. (Opcional) Si quieres repo privado: crear token de lectura (sección 🔑 1) y usar la URL con token.

## 🔒 Reglas de seguridad obligatorias

- **Nunca** confirmes tokens en el repo, issues, PRs, logs ni la app web (`.gitignore` ya excluye el clon crudo y los CSV con URLs riesgosas; puedes añadir `gitleaks` como pre-commit).
- Tokens con **mínimo privilegio** (lectura solo para leer; escritura solo para actualizar) y **expiración** corta; rota y revoca desde *Settings → Developer settings* si dudas.
- Activa **2FA** en tu cuenta de GitHub y revisa *Security log* de vez en cuando.
- En Actions usa **secrets** (`${{ secrets.… }}`), nunca imprimas variables de entorno con secretos.
- La TV solo necesita **leer** playlists públicas: si el repo es público, no expongas ningún token en la TV.

## 📂 Links que puedes usar directo en la app IPTV

```
.../playlists/tv-chile-todo.m3u            ← TODO numerado (3.110)
.../playlists/chile-segura.m3u             ← solo Chile sanitizado
.../playlists/m3u-cl/region-biobio.m3u     ← tu región
.../playlists/es/tema-anime.m3u            ← por tema ES
.../playlists/fuentes/pluto-es.m3u         ← por fuente
```
