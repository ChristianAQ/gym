# GymRat

PWA de gimnasio mobile-first: registra tus entrenamientos, mantén la racha de
días consecutivos, guarda tus récords personales (PRs) y compite con tus
amigos en un ranking.

- **Frontend:** React + Vite, Tailwind CSS, Framer Motion (transiciones entre
  pantallas, calendario animado, micro-interacciones).
- **Backend:** Firebase (Auth + Firestore), plan gratuito **Spark** — sin
  servidor propio.
- **Despliegue:** GitHub Pages, mediante GitHub Actions
  (`.github/workflows/pages.yml`), que compila con Vite y publica `dist/`.
- **Enrutado:** `HashRouter` de React Router, para que las rutas funcionen en
  GitHub Pages sin configuración de servidor adicional.

## Desarrollo local

```sh
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173/gym/`, con
el mismo prefijo `/gym/` que usará en producción).

```sh
npm run build    # genera dist/
npm run preview  # sirve dist/ para probarlo como en producción
```

## Firebase

El proyecto ya usa unas credenciales de ejemplo en `src/firebase.js`, del
proyecto `gymrat-b52da`. Las claves de una app web de Firebase no son
secretas (están pensadas para ir en el cliente); la seguridad la dan las
reglas de Firestore (`firestore.rules`). Si quieres usar tu propio proyecto,
sustituye el objeto `firebaseConfig` por el de tu consola.

Pasos necesarios en la [consola de Firebase](https://console.firebase.google.com)
para que el login funcione:

1. **Authentication → Sign-in method**: activa los proveedores **Google** y
   **Correo electrónico/contraseña**.
2. **Authentication → Settings → Authorized domains**: añade el dominio de
   GitHub Pages (`<tu-usuario>.github.io`) para que el popup de Google
   funcione ahí (`localhost` ya viene añadido por defecto para desarrollo).
3. **Firestore Database**: crea la base de datos (modo producción) y publica
   las reglas de `firestore.rules` (Firestore → Reglas → pegar → Publicar).

### Modelo de datos

```
/users/{uid}
  displayName, photoURL, email
  currentStreak, bestStreak, lastWorkoutDate
  workoutDates: ["2026-09-01", ...]   // para pintar el calendario
  prs: { "Press banca": { weight, reps, date }, ... }

/users/{uid}/workouts/{id}            // detalle de cada entrenamiento
/users/{uid}/friends/{friendUid}       // amistades (mutuas)
```

Cualquier usuario autenticado puede **leer** el perfil de cualquier otro
(necesario para el ranking), pero solo su dueño puede **escribirlo**. Los
amigos se añaden por **ID de GymRat** (el `uid`, visible y copiable desde el
perfil): al añadir a alguien se crea la relación en ambos sentidos, así que
no hace falta que la otra persona confirme la solicitud.

## Despliegue en GitHub Pages

1. En GitHub, ve a **Settings → Pages**.
2. En "Build and deployment" → **Source**, elige **GitHub Actions**.
3. Haz push a `master` (o lanza el workflow manualmente desde la pestaña
   *Actions*): compila con Vite y publica en
   `https://<tu-usuario>.github.io/gym/`.

Si cambias el nombre del repositorio, actualiza `base` en `vite.config.js`
(y `start_url`/`scope` del manifest PWA) para que coincida con la nueva ruta.

## Iconos y logo

`logo.jpg` es el logo original en alta resolución. Los assets realmente
usados por la app están en `assets/` y `public/icons/` (recortes PNG con
fondo transparente, más los iconos 192/512 usados por el manifest PWA).
