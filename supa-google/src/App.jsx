// src/App.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import GoogleButton from "./components/GoogleButton";
import "./index.css"; // make sure your .login-container & Google button styles live here

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // On mount: check existing session & listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(handleSession);
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      handleSession({ data: { session } });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Shared session handler
  async function handleSession({ data: { session } }) {
    if (!session?.user) {
      setUser(null);
      return;
    }

    // Query the profiles table for this user’s ID
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();

    // If no row or error → not whitelisted
    if (error || !data) {
      setMessage(
        "Access denied. If you believe this is an error, please contact an administrator."
      );
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    // Whitelisted → proceed
    setMessage("Successfully logged in!");
    setUser(session.user);
  }

  // Trigger Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage("Signing in…");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error(error);
      setMessage("Error encountered. Unable to log in to site.");
      setLoading(false);
    }
  };

  // Sign out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessage("");
  };

  // Render “Access Denied” if blocked
  if (message && !user && message.includes("Access denied")) {
    return (
      <div className="login-container">
        <h2>Access Denied</h2>
        <p className="error-message">{message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  // Render dashboard if logged in
  if (user) {
    return (
      <div className="login-container">
        <h2>Home</h2>
        <p>Welcome, {user.user_metadata.full_name || user.email}!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // Otherwise render centered login view
  return (
    <div className="login-container">
      <h2>Login</h2>
      <GoogleButton onClick={handleGoogleLogin} disabled={loading} />
      {message && (
        <p
          style={{ marginTop: "1rem" }}
          className={
            message.includes("Error") || message.includes("Access denied")
              ? "error-message"
              : ""
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
