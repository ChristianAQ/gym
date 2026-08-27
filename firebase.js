// Puente entre GymRat y Firebase (Auth + Firestore).
//
// Expone `window.GymDBReady`: una promesa que resuelve con un objeto
// `{ loadState(), saveState(data) }` una vez hay una sesión anónima activa,
// o con `null` si Firebase no está configurado (ver firebase-config.js).
// El resto de la app (index.html) espera a esta promesa y sigue funcionando
// en modo local si resuelve a null.

let resolveReady;
window.GymDBReady = new Promise((res) => { resolveReady = res; });

const config = window.FIREBASE_CONFIG;

if (!config || !config.apiKey || config.apiKey === "TU_API_KEY") {
  console.warn(
    "[GymRat] Firebase no está configurado todavía — edita firebase-config.js " +
    "con las claves de tu proyecto. La app sigue funcionando en modo local " +
    "(los datos no se guardan entre sesiones)."
  );
  resolveReady(null);
} else {
  const FIREBASE_VERSION = "10.13.2";
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

  Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]).then(([{ initializeApp }, authMod, storeMod]) => {
    const { getAuth, signInAnonymously, onAuthStateChanged } = authMod;
    const { getFirestore, doc, getDoc, setDoc } = storeMod;

    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let saveTimer = null;
    let pending = null;

    const api = {
      uid: null,
      async loadState() {
        if (!api.uid) return null;
        const snap = await getDoc(doc(db, "users", api.uid));
        return snap.exists() ? snap.data() : null;
      },
      saveState(data) {
        pending = data;
        if (!api.uid) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          setDoc(doc(db, "users", api.uid), pending, { merge: true }).catch((err) => {
            console.error("[GymRat] No se pudo guardar en Firestore:", err);
          });
        }, 600);
      },
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        api.uid = user.uid;
        resolveReady(api);
      }
    });
    signInAnonymously(auth).catch((err) => {
      console.error("[GymRat] Fallo el inicio de sesión anónimo de Firebase:", err);
      resolveReady(null);
    });
  }).catch((err) => {
    console.error("[GymRat] No se pudo cargar el SDK de Firebase:", err);
    resolveReady(null);
  });
}
