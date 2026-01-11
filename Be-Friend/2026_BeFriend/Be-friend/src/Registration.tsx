import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Registration() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [program, setProgram] = useState("");
  const [clubs, setClubs] = useState("");
  const [interests, setInterests] = useState("");
  const [accommodations, setAccommodations] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    async function run() {
      if (!user) {
        navigate("/Login");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && (snap.data() as any)?.onboarded) {
        navigate("/account");
        return;
      }

      setName(user.displayName ?? "");
      setLoading(false);
    }
    run();
  }, [navigate, user]);

  const canSubmit = useMemo(() => {
    return !!name.trim() && !!program.trim();
  }, [name, program]);

  async function handleSubmit() {
    if (!user) return;
    if (!canSubmit) return;

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: name.trim(),
          program: program.trim(),
          clubs: clubs.trim(),
          interests: interests.trim(),
          accommodations: accommodations.trim(),
          // ✅ Use Google profile photo only
          photoURL: user.photoURL ?? "",
          onboarded: true,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/account");
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="animated-maroon-bg" style={{ minHeight: "100vh" }} />;
  }

  return (
    <div className="animated-maroon-bg" style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome 👋</h1>
        <p style={styles.subtitle}>
          Let’s set up your Plinder profile so we can match you with the right people and activities.
        </p>

        {/* Google profile pic preview (no upload) */}
        <div style={styles.avatarRow}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Google profile" style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback} />
          )}
          <div style={{ opacity: 0.85, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 900 }}>Using your Google profile photo</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              (MVP: custom uploads disabled)
            </div>
          </div>
        </div>

        <label style={styles.label}>Name</label>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />

        <label style={styles.label}>Program</label>
        <input
          style={styles.input}
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          placeholder="e.g., Electrical Engineering"
        />

        <label style={styles.label}>Clubs</label>
        <input
          style={styles.input}
          value={clubs}
          onChange={(e) => setClubs(e.target.value)}
          placeholder="e.g., Rocketry, Formula Electric"
        />

        <label style={styles.label}>Interests</label>
        <input
          style={styles.input}
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g., gym, anime, coffee, gaming"
        />

        <label style={styles.label}>Any accommodations we should know about?</label>
        <textarea
          style={styles.textarea}
          value={accommodations}
          onChange={(e) => setAccommodations(e.target.value)}
          placeholder="Open-ended: accessibility needs, sensory preferences, mobility, communication, anything you want others to respect."
        />

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          style={{
            ...styles.submit,
            opacity: !canSubmit || saving ? 0.6 : 1,
            cursor: !canSubmit || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Create Account"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 640,
    padding: 32,
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 900,
    margin: "0 0 10px 0",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: "0 0 18px 0",
    opacity: 0.9,
    lineHeight: 1.6,
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    marginBottom: 18,
    padding: 14,
    borderRadius: 18,
    background: "rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.25)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "2px solid rgba(255,255,255,0.18)",
  },
  label: { display: "block", marginTop: 12, fontWeight: 800, opacity: 0.95 },
  input: {
    width: "100%",
    marginTop: 8,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.18)",
    color: "white",
    outline: "none",
  },
  textarea: {
    width: "100%",
    marginTop: 8,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.18)",
    color: "white",
    outline: "none",
    minHeight: 110,
    resize: "vertical",
  },
  submit: {
    marginTop: 18,
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "none",
    fontWeight: 900,
    background: "white",
    color: "#6b0f1a",
    boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
  },
};
