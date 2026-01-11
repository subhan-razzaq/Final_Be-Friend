import React, { useState } from "react";
import { auth } from "./firebase";

type MatchCard = {
  uid: string;
  name: string;
  program: string;
  clubs: string;
  interests: string;
  accommodations: string;
  photoURL: string;
};

type DiscoverResponse = {
  activities: string[];
  matches: MatchCard[];
};

const API_BASE = "http://127.0.0.1:8000";

export default function Discover() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<DiscoverResponse | null>(null);

  async function handleDiscover() {
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in first.");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE}/discover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ limit_people: 3, limit_activities: 6 }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      setData((await res.json()) as DiscoverResponse);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animated-maroon-bg" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Discover</h1>
            <p style={styles.subtitle}>
              Click discover to see friend matches + activity ideas.
            </p>
          </div>

          <button
            onClick={handleDiscover}
            disabled={loading}
            style={{
              ...styles.discoverBtn,
              opacity: loading ? 0.65 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Finding..." : "Discover"}
          </button>
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        {data?.activities?.length ? (
          <div style={styles.activitiesBox}>
            <div style={styles.boxHeader}>
              <h3 style={styles.h3}>Suggested activities</h3>
              <span style={styles.pill}>near McMaster</span>
            </div>

            <div style={styles.activitiesGrid}>
              {data.activities.map((a, i) => (
                <div key={i} style={styles.activityItem}>
                  <div style={styles.dot} />
                  <div style={styles.activityText}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data?.matches?.length ? (
          <div style={styles.matchesBox}>
            <div style={styles.boxHeader}>
              <h3 style={styles.h3}>Recommended people</h3>
              <span style={styles.pill}>{data.matches.length} matches</span>
            </div>

            <div style={styles.matchesGrid}>
              {data.matches.map((m) => (
                <div key={m.uid} style={styles.matchCard}>
                  <div style={styles.matchTop}>
                    {m.photoURL ? (
                      <img src={m.photoURL} alt={m.name} style={styles.avatar} />
                    ) : (
                      <div style={styles.avatarFallback} />
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div style={styles.matchName}>{m.name}</div>
                      <div style={styles.matchProgram}>{m.program}</div>
                    </div>
                  </div>

                  <div style={styles.tagsRow}>
                    {m.clubs?.trim() ? <span style={styles.tag}>🏷️ {m.clubs}</span> : null}
                    {m.interests?.trim() ? <span style={styles.tag}>⭐ {m.interests}</span> : null}
                    {m.accommodations?.trim() ? <span style={styles.tag}>♿ {m.accommodations}</span> : null}
                  </div>

                  <div style={styles.uidText}>{m.uid}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.section}>
            <h3 style={styles.h3}>Next steps</h3>
            <p style={styles.p}>• Show recommended matches</p>
            <p style={styles.p}>• Suggest “doable” activities</p>
            <p style={styles.p}>• Filter by program / interests / schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    padding: "88px 24px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: 920,
    padding: 32,
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: "2.2rem",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  subtitle: { marginTop: 10, opacity: 0.9, lineHeight: 1.6 },

  discoverBtn: {
    background: "#ffffff",
    color: "#6b0f1a",
    padding: "12px 18px",
    borderRadius: 999,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },

  errorBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255, 60, 60, 0.10)",
    border: "1px solid rgba(255, 120, 120, 0.20)",
    opacity: 0.95,
    lineHeight: 1.45,
  },

  activitiesBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    background: "rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  matchesBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    background: "rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  boxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  pill: {
    fontSize: "0.78rem",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    opacity: 0.9,
    fontWeight: 800,
  },

  activitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },

  activityItem: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  dot: {
    marginTop: 6,
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.85)",
    boxShadow: "0 0 18px rgba(255,255,255,0.20)",
    flexShrink: 0,
  },

  activityText: {
    opacity: 0.95,
    lineHeight: 1.45,
  },

  matchesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },

  matchCard: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  matchTop: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    minWidth: 0,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 999,
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.20)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    flexShrink: 0,
  },

  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "2px solid rgba(255,255,255,0.18)",
    flexShrink: 0,
  },

  matchName: {
    fontWeight: 900,
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  matchProgram: {
    marginTop: 2,
    opacity: 0.85,
    fontSize: "0.92rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  tagsRow: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    fontSize: "0.82rem",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.16)",
    border: "1px solid rgba(255,255,255,0.10)",
    opacity: 0.95,
  },

  uidText: {
    marginTop: 10,
    fontSize: "0.75rem",
    opacity: 0.55,
    wordBreak: "break-all",
  },

  section: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    background: "rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  h3: { margin: 0, fontSize: "1rem", fontWeight: 900 },
  p: { margin: "8px 0 0 0", opacity: 0.9, lineHeight: 1.55 },
};
