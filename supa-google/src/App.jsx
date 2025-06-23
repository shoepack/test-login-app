// src/App.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import GoogleButton from "./components/GoogleButton";
import "./index.css"; // make sure your .login-container & Google button styles live here

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isCheckingProfileRef = useRef(false);
  const lastCheckedUserIdRef = useRef(null);

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
    // Clear any existing messages when session changes
    if (!session?.user) {
      setUser(null);
      isCheckingProfileRef.current = false;
      lastCheckedUserIdRef.current = null;
      return;
    }

    // Prevent multiple simultaneous profile checks for the same user
    if (
      isCheckingProfileRef.current ||
      lastCheckedUserIdRef.current === session.user.id
    ) {
      return;
    }

    isCheckingProfileRef.current = true;
    lastCheckedUserIdRef.current = session.user.id;

    try {
      // Query the profiles table for this user's ID (using select without .single() to avoid 406 errors)
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id);

      // Handle database errors (not including "no rows found" which is expected for non-whitelisted users)
      if (error) {
        console.error("Profile lookup error:", error);
        setMessage(
          "An error occurred while verifying your access. Please try again."
        );
        await supabase.auth.signOut();
        setUser(null);
        isCheckingProfileRef.current = false;
        lastCheckedUserIdRef.current = null;
        return;
      }

      // Check if user is whitelisted (data array should have exactly one item)
      if (!data || data.length === 0) {
        // User not found in profiles table → not whitelisted
        setMessage(
          "Access denied. If you believe this is an error, please contact an administrator."
        );
        await supabase.auth.signOut();
        setUser(null);
        isCheckingProfileRef.current = false;
        lastCheckedUserIdRef.current = null;
        return;
      }

      // Whitelisted → proceed
      setMessage("Successfully logged in!");
      setUser(session.user);
      isCheckingProfileRef.current = false;
    } catch (err) {
      console.error("Unexpected error during profile check:", err);
      setMessage("An unexpected error occurred. Please try again.");
      await supabase.auth.signOut();
      setUser(null);
      isCheckingProfileRef.current = false;
      lastCheckedUserIdRef.current = null;
    }
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
    isCheckingProfileRef.current = false;
    lastCheckedUserIdRef.current = null;
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
