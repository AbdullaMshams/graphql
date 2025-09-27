import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeroGeometric } from "../components/ui/shadcn-io/shape-landing-hero/index";

// You can remove this line if you are not using a separate CSS file anymore.
// import '../styles/LoginPage.css';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage("Please enter username/email and password.");
      setLoading(false);
      return;
    }

    try {
      const encoded = btoa(`${usernameOrEmail}:${password}`);
      const res = await fetch("https://learn.reboot01.com/api/auth/signin", {
        method: "POST",
        headers: { Authorization: `Basic ${encoded}` },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Login failed (${res.status})`);
      }

      const data = await res.json();
      const token = data?.JWT || data?.token || data;
      if (!token) {
        throw new Error("No token returned from server");
      }

      if (!token) {
  throw new Error("No token returned from server");
}

localStorage.setItem("JWT", token);
setPassword("");
setErrorMessage("");
navigate("/"); // ✅ move here
    } catch (error) {
      setErrorMessage(error.message || "Network error");

    } finally {
      // navigate("/");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Component */}
      <HeroGeometric className="absolute inset-0 z-0" />

      {/* Login Form Container */}
      <div className="relative z-10 w-full max-w-sm">
        <form
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-8 flex flex-col space-y-4"
          onSubmit={handleSubmit}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-4">Login</h2>

          {/* Input fields */}
          <input
            type="text"
            placeholder="Username or Email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {/* Error Message */}
          {errorMessage && (
            <p className="text-red-400 text-sm text-center">{errorMessage}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 px-4 py-3 bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;