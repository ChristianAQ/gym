// Configuración de tu proyecto Firebase.
//
// Cómo obtenerla:
//   1. Entra en https://console.firebase.google.com y crea un proyecto (o usa uno existente).
//   2. Añade una "app web" al proyecto (icono </>).
//   3. Copia el objeto `firebaseConfig` que te muestra la consola y pégalo abajo.
//   4. En el proyecto, activa Authentication → Sign-in method → "Anonymous".
//   5. Crea una base de datos en Firestore (modo producción) y publica las reglas
//      del archivo firestore.rules incluido en este repo.
//
// Mientras dejes los valores de ejemplo tal cual, la app funciona en modo local
// (sin guardar nada) exactamente igual que antes de añadir Firebase.
window.FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};
