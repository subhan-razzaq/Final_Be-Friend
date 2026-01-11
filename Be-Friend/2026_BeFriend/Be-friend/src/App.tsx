import { useEffect, useState } from "react";
import "./App.css";
import { signOut, onAuthStateChanged } from "firebase/auth";

import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";

import Home from "./Home";
import Login from "./Login";
import Registration from "./Registration";
import Account from "./Account";
import Discover from "./Discover";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

/* ---------------- App ---------------- */

function App() {
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDisplayName("");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? (snap.data() as any) : null;
        setDisplayName(data?.name ?? user.displayName ?? "there");
      } catch {
        setDisplayName(user.displayName ?? "there");
      }
    });

    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <AppShell displayName={displayName} />
    </BrowserRouter>
  );
}

export default App;

/* ---------------- Shell ---------------- */

function AppShell({ displayName }: { displayName: string }) {
  const navigate = useNavigate();
  const isSignedIn = !!displayName;

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
      alert("Failed to log out.");
    }
  }

  return (
    <>
      {/* Navigation */}
      <nav style={navStyles.nav}>
        <Link to="/" style={navStyles.link}>
          Home
        </Link>

        {/*  Add Discover only when signed in */}
        {isSignedIn && (
          <Link to="/discover" style={navStyles.link}>
            Discover
          </Link>
        )}

        {isSignedIn ? (
          <>
            <Link to="/account" style={navStyles.link}>
              {`Hi ${displayName}!`}
            </Link>

            <button onClick={handleLogout} style={navStyles.logoutBtn}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/Login" style={navStyles.link}>
            Sign In
          </Link>
        )}
      </nav>

      {/* Pages */}
      <Routes>
        {/*  pass signed-in state to Home so button can change */}
        <Route path="/" element={<Home isSignedIn={isSignedIn} />} />

        <Route path="/Login" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/account" element={<Account />} />

        {/*  new page */}
        <Route path="/discover" element={<Discover />} />

        <Route path="*" element={<h2>404 - Page not found</h2>} />
      </Routes>
    </>
  );
}

/* ---------------- styles ---------------- */

const navStyles: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed",
    top: 16,
    right: 24,
    display: "flex",
    gap: 14,
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    zIndex: 9999,
    alignItems: "center",
  },
  link: {
    color: "rgba(255,255,255,0.92)",
    textDecoration: "none",
    fontWeight: 800,
    padding: "8px 12px",
    borderRadius: 999,
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 999,
    padding: "8px 12px",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 900,
    cursor: "pointer",
  },
};
