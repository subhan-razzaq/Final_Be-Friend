import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

type Profile = {
  name?: string;
  program?: string;
  clubs?: string;
  interests?: string;
  accommodations?: string;
  photoURL?: string;
};

export default function Account() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>({});

  useEffect(() => {
    async function run() {
      const user = auth.currentUser;
      if (!user) {
        navigate("/Login");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? (snap.data() as Profile) : null;
      setProfile(data);
      setEditedProfile(data || {});
    }
    run();
  }, [navigate]);

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    await updateDoc(doc(db, "users", user.uid), editedProfile);
    setProfile({ ...editedProfile });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleChange = (field: keyof Profile, value: string) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  return (
    <div className="animated-maroon-bg" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile" style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback} />
          )}

          <div style={{ flex: 1 }}>
            <h1 style={styles.title}>
              {profile?.name ? `Hi ${profile.name}!` : "Your Account"}
            </h1>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.program || ""}
                onChange={(e) => handleChange("program", e.target.value)}
                style={styles.programInput}
                placeholder="Enter program..."
              />
            ) : (
              <p style={styles.subtitle}>{profile?.program ?? ""}</p>
            )}
          </div>

          {!isEditing ? (
            <button onClick={handleEdit} style={styles.editBtn}>
              ✏️ Edit
            </button>
          ) : (
            <div style={styles.btnGroup}>
              <button onClick={handleSave} style={styles.saveBtn}>
                Save
              </button>
              <button onClick={handleCancel} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>Clubs</h3>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.clubs || ""}
              onChange={(e) => handleChange("clubs", e.target.value)}
              style={styles.input}
              placeholder="Enter clubs..."
            />
          ) : (
            <p style={styles.p}>{profile?.clubs || "—"}</p>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>Interests</h3>
          {isEditing ? (
            <textarea
              value={editedProfile.interests || ""}
              onChange={(e) => handleChange("interests", e.target.value)}
              style={styles.textarea}
              placeholder="Enter interests..."
              rows={3}
            />
          ) : (
            <p style={styles.p}>{profile?.interests || "—"}</p>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>Accommodations</h3>
          {isEditing ? (
            <textarea
              value={editedProfile.accommodations || ""}
              onChange={(e) => handleChange("accommodations", e.target.value)}
              style={styles.textarea}
              placeholder="Enter accommodations..."
              rows={3}
            />
          ) : (
            <p style={styles.p}>{profile?.accommodations || "—"}</p>
          )}
        </div>
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
    maxWidth: 740,
    padding: 32,
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  topRow: { 
    display: "flex", 
    gap: 16, 
    alignItems: "center", 
    marginBottom: 18 
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.25)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "2px solid rgba(255,255,255,0.18)",
  },
  title: { 
    margin: 0, 
    fontSize: "2rem", 
    fontWeight: 900, 
    letterSpacing: "-0.03em" 
  },
  subtitle: { 
    margin: "6px 0 0 0", 
    opacity: 0.85 
  },
  programInput: {
    marginTop: 6,
    width: "100%",
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    opacity: 0.85,
  },
  section: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    background: "rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  h3: { 
    margin: 0, 
    fontSize: "1rem", 
    fontWeight: 900 
  },
  p: { 
    margin: "8px 0 0 0", 
    opacity: 0.9, 
    lineHeight: 1.55 
  },
  editBtn: {
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    backdropFilter: "blur(10px)",
  },
  btnGroup: {
    display: "flex",
    gap: 10,
  },
  saveBtn: {
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    background: "#22c55e",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  input: {
    marginTop: 8,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    marginTop: 8,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
};