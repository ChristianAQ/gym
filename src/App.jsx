import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "./components/ProtectedRoute";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LogWorkout from "./pages/LogWorkout";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Routine from "./pages/Routine";

function AppShell({ children, showNav }) {
  return (
    <div className="min-h-screen">
      {showNav && <TopBar />}
      <main className={showNav ? "pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-28" : ""}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell showNav>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ProtectedRoute>
              <AppShell showNav={false}>
                <LogWorkout />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routine"
          element={
            <ProtectedRoute>
              <AppShell showNav>
                <Routine />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <AppShell showNav>
                <Leaderboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell showNav>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
