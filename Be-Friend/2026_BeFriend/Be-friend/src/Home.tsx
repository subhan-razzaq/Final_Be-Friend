// Home.tsx
import { Link } from "react-router-dom";

export default function Home({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="animated-maroon-bg" style={styles.page}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <h1
          style={styles.title}
          onMouseEnter={(e) => {
            e.currentTarget.style.textShadow =
              "0 0 12px #ff4d6d, 0 0 24px #ff4d6d, 0 0 48px #ff758f";
            e.currentTarget.style.transform =
              "translateY(-4px) skewX(-2deg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Be-Friend
        </h1>

        <p style={styles.subtitle}>
          Find people.  
          Discover activities.  
          Build real friendships.
        </p>

        <div style={styles.actions}>
          <Link
            to={isSignedIn ? "/discover" : "/Login"}
            style={styles.primaryBtn}
          >
            {isSignedIn ? "Discover" : "Get Started"}
          </Link>

          <p style={styles.hint}>
            {isSignedIn
              ? "Explore suggested friends and activities."
              : "Sign in to get personalized matches and activity recommendations."}
          </p>
        </div>
      </div>

      {/* Text Section */}
      <div style={styles.infoSection}>
        <div style={styles.infoCard}>
          <h3>Friend-first Matching 🤝</h3>
          <p>
            Be-Friend connects you with like-minded people who share your interests, 
            belong to similar clubs, and have compatible accessibility needs.
          </p>
        </div>

        <div style={styles.infoCard}>
          <h3>Get activities recommended to you based off your profile 🧑</h3>
          <p>
            Our system recommends things you can actually do together,
            from study sessions to fitness and social events.
          </p>
        </div>

        <div style={styles.infoCard}>
          <h3>Built for McMaster Students! 📚</h3>
          <p>
            Designed for campus life, juggling classes, and finding your people at Mac.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 24px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  hero: {
    maxWidth: 700,
    textAlign: "center",
    marginTop: "8vh",
  },

  title: {
    fontSize: "clamp(3rem, 6vw, 4.5rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 16,
    cursor: "pointer",

    transition: "all 0.35s ease",
    textShadow: "0 0 0 rgba(255,255,255,0)",
    transform: "translateY(0)",
  },

  subtitle: {
    fontSize: "1.25rem",
    lineHeight: 1.6,
    opacity: 0.95,
    marginBottom: 40,
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },

  primaryBtn: {
    background: "#ffffff",
    color: "#6b0f1a",
    padding: "14px 28px",
    borderRadius: 999,
    fontWeight: 800,
    textDecoration: "none",
    fontSize: "1rem",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    transition: "transform 0.15s ease",
  },

  hint: {
    fontSize: "0.9rem",
    opacity: 0.8,
  },

  infoSection: {
    marginTop: "12vh",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 32,
    width: "100%",
  },

  infoCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    backdropFilter: "blur(8px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
};
