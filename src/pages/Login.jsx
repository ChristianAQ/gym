import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PageTransition from "../components/PageTransition";
import { asset } from "../lib/asset";

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Prueba a iniciar sesión.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/popup-closed-by-user": "Ventana de Google cerrada antes de terminar.",
  "auth/operation-not-allowed": "Este método de acceso no está activado todavía en Firebase.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
};

function friendlyError(err) {
  return ERROR_MESSAGES[err?.code] || "Algo ha fallado. Inténtalo de nuevo.";
}

export default function Login() {
  const { user, loading, signInWithGoogle, registerWithEmail, loginWithEmail } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition className="min-h-screen flex flex-col justify-center px-6 py-10">
      <div className="max-w-sm mx-auto w-full">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center mb-8"
        >
          <img src={asset("icons/logo.png")} alt="GymRat" className="w-28 h-auto drop-shadow-[0_0_25px_rgba(255,92,0,0.35)]" />
          <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide mt-4 text-center">
            Gym<span className="text-blaze-500">Rat</span>
          </h1>
          <p className="text-ink-400 text-sm mt-1 text-center">
            Registra tu entrenamiento. Mantén la racha. Compite.
          </p>
        </motion.div>

        <div className="flex bg-ink-800 rounded-2xl p-1 mb-6">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl font-heading uppercase text-sm tracking-wide transition-colors ${
                mode === m ? "bg-blaze-gradient text-white shadow-blaze" : "text-ink-400"
              }`}
            >
              {m === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <UserIcon className="w-5 h-5 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="w-5 h-5 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-11"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-blaze-300 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-ink-800" />
          <span className="text-ink-500 text-xs uppercase tracking-wide">o</span>
          <div className="h-px flex-1 bg-ink-800" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="btn-ghost w-full flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <p className="text-ink-600 text-xs text-center mt-8 flex items-center justify-center gap-1">
          <Flame className="w-3.5 h-3.5" /> No excuses. Just reps.
        </p>
      </div>
    </PageTransition>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.87c2.27-2.09 3.56-5.17 3.56-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-2.98c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.31A7.2 7.2 0 010 12c0-.8.14-1.57.38-2.31V6.6H1.27a12 12 0 000 10.8z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4-3.09C6.22 4.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
