# GymRat

Prototipo de app de gimnasio (registro de entrenamientos, racha, calendario,
récords y tabla de amigos) construido como una página estática — sin build,
sin backend propio. Corre directamente en el navegador: `support.js` carga
React, ReactDOM y Babel desde CDN en tiempo de ejecución y compila la lógica
y el frame de `index.html` / `ios-frame.jsx` al vuelo.

## Ver en local

No hace falta ningún paso de build. Basta con servir la carpeta con cualquier
servidor estático, por ejemplo:

```sh
python3 -m http.server 8080
```

y abrir `http://localhost:8080/`.

## Despliegue en GitHub Pages

El repo incluye `.github/workflows/pages.yml`, que publica el contenido tal
cual en cada push a `master`. Solo falta activarlo una vez:

1. En GitHub, ve a **Settings → Pages**.
2. En "Build and deployment" → **Source**, elige **GitHub Actions**.
3. Haz push a `master` (o lanza el workflow manualmente desde la pestaña
   *Actions*) y la web quedará publicada en
   `https://<tu-usuario>.github.io/gym/`.

El archivo `.nojekyll` es necesario porque GitHub Pages, si usa Jekyll,
ignora por defecto las carpetas que empiezan por `_` (como `_ds/`, donde vive
el sistema de diseño).

## Logo

`logo.jpg` es el logo original (con fondo a cuadros de una exportación con
transparencia). Los assets realmente usados por la app están en `assets/`:
recortes en PNG con fondo transparente (`logo.png` para la cabecera y
`favicon-*.png` / `apple-touch-icon.png` para el icono del sitio).

## Base de datos: Firebase

El progreso del usuario (historial, racha, récords, logros, ajustes) se
guarda en **Firestore**, identificando a cada visitante con un inicio de
sesión anónimo de **Firebase Authentication**. Sin configurar Firebase, la
app sigue funcionando exactamente igual que antes: todo en memoria, se
pierde al recargar.

Para activarlo:

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com).
2. Añade una app web (icono `</>`) y copia el objeto de configuración que te
   da la consola.
3. Pégalo en `firebase-config.js`, sustituyendo los valores de ejemplo.
4. En **Authentication → Sign-in method**, activa el proveedor **Anonymous**.
5. Crea una base de datos **Firestore** (modo producción) y publica las
   reglas de `firestore.rules` (Firestore → Reglas → pegar → Publicar).
6. Haz commit y push de `firebase-config.js` con tus claves reales.

Notas:

- Las claves de un proyecto Firebase web (`apiKey`, etc.) no son secretas —
  están pensadas para ir en el cliente; la seguridad la dan las reglas de
  Firestore de arriba, que solo dejan a cada usuario leer/escribir su propio
  documento.
- La tabla de amigos sigue usando datos de ejemplo (`friendsData` en
  `index.html`): construir amigos reales necesitaría cuentas de verdad
  (no anónimas) y una colección de usuarios pública o compartida, que no
  está incluida todavía.
