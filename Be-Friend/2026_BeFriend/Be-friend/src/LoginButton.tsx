import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useNavigate } from "react-router-dom";

function LoginButton() {
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/registration"); // ✅ go to registration after login
    } catch (err) {
      console.error("Login failed", err);
    }
  }

  return (
    <button onClick={handleLogin} style={btn}>
      Sign in with Google
    </button>
  );
}

const btn: React.CSSProperties = {
  background: "#ffffff",
  color: "#6b0f1a",
  padding: "14px 28px",
  borderRadius: 999,
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.2)",
  cursor: "pointer",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

export default LoginButton;
