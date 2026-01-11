// Login.tsx
import LoginButton from "./LoginButton"; // adjust path if needed
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="animated-maroon-bg" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.logoDot} />
          <span style={styles.brand}>Be-Friend</span>
        </div>

        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>
          Log in to match with friends!
        </p>

        <div style={styles.buttonWrap}>
          <LoginButton />
        </div>

        <p style={styles.smallText}>
          By continuing, you agree to keep it respectful and friendly.
        </p>

        <Link to="/" style={styles.backLink}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #6b0f1a 0%, #3a0a0f 100%)",
    padding: "24px",
    color: "#ffffff",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    padding: "32px",
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    opacity: 0.95,
  },

  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 0 16px rgba(255,255,255,0.25)",
  },

  brand: {
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },

  title: {
    fontSize: "2.2rem",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    margin: "0 0 10px 0",
  },

  subtitle: {
    margin: "0 0 22px 0",
    lineHeight: 1.6,
    opacity: 0.9,
  },

  buttonWrap: {
    marginTop: 8,
  },

  smallText: {
    marginTop: 18,
    fontSize: "0.9rem",
    opacity: 0.75,
  },

  backLink: {
    display: "inline-block",
    marginTop: 18,
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    fontWeight: 700,
  },
};
