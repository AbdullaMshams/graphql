import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SpotlightCard from "../components/SpotlightCard";
// FIX: Correcting the import path. Assuming the component is exported directly from the folder or index.js
import { HeroGeometric } from "../components/ui/shadcn-io/shape-landing-hero";
import  dash  from "../assets/dashboard.png";
import LevelProgress from "../components/LevelProgress"; 

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

   const DASHBOARD_IMAGE_URL = dash; 

  // Simple inline SVG Spinner component
  const Spinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

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

    if (!token) throw new Error("No token returned from server");

    // Save token before navigation
    localStorage.setItem("JWT", token);
    setPassword("");

    // ✅ Optional short delay (to show a smooth transition)
    setTimeout(() => {
      navigate("/", { state: { fromLogin: true } });
    }, 300); // short 300ms delay for smoother transition
  } catch (error) {
    setErrorMessage(error.message || "Network error");
  } finally {
    setLoading(false);
  }
};


  // return (
  //   <div className="relative min-h-screen flex items-center justify-center p-4">
  //     {/* Background Component */}
  //     <HeroGeometric className="absolute inset-0 z-0" />

  //     {/* Login Form Container */}
  //     <div className="relative z-10 w-full max-w-sm">
  //       <form
  //         className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-8 flex flex-col space-y-4"
  //         onSubmit={handleSubmit}
  //       >
  //         <h2 className="text-3xl font-bold text-white text-center mb-4">Login</h2>

  //         {/* Input fields */}
  //         <input
  //           type="text"
  //           placeholder="Username or Email"
  //           value={usernameOrEmail}
  //           onChange={(e) => setUsernameOrEmail(e.target.value)}
  //           className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //         />
  //         <input
  //           type="password"
  //           placeholder="Password"
  //           value={password}
  //           onChange={(e) => setPassword(e.target.value)}
  //           className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //         />

  //         {/* Error Message */}
  //         {errorMessage && (
  //           <p className="text-red-400 text-sm text-center">{errorMessage}</p>
  //         )}

  //         {/* Submit Button */}
  //         <button
  //           type="submit"
  //           disabled={loading}
  //           className="w-full mt-4 px-4 py-3 bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //         >
  //           {loading ? (
  //             <>
  //               <Spinner />
  //               Signing in...
  //             </>
  //           ) : (
  //             "Sign In"
  //           )}
  //         </button>
  //       </form>
  //     </div>
  //   </div>
  // );

  const CARD_BG = "#030303"; // Dark gray for card backgrounds
  const ACCENT_GREEN = "#c9f24d"; // The lime green from Image 2

  const cardClass = `
    bg-[${CARD_BG}] 
    rounded-2xl 
    shadow-lg 
    transition-all duration-300 ease-in-out 
    hover:translate-y-[-2px] 
    hover:shadow-xl 
    flex flex-col 
    p-6 // Apply padding universally to cards
    text-white
  `;

  const DEFAULT_SPOTLIGHT_COLOR = `rgba(201, 242, 77, 0.1)`; // Light lime glow
  const LOGOUT_SPOTLIGHT_COLOR = "rgba(255, 0, 0, 0.2)"; 

  return (
    <div className="relative min-h-screen overflow-hidden font-inter">
      <HeroGeometric className="absolute inset-0 z-0" />

      {/* Main Container: Centered, Large Card Look */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        
        {/* Two-Column Card Wrapper (Responsive) */}
        <div 
          className="flex w-full max-w-7xl h-[65vh] min-h-[600px] rounded-3xl shadow-2xl overflow-hidden bg-gray-900 border border-gray-700/20"
        >
          
          {/* LEFT COLUMN: Dashboard Preview Image (Hidden on Small Screens) */}
          <div 
            className="hidden lg:flex w-2/3 relative bg-cover bg-no-repeat rounded-l-3xl"
            style={{ 
              // 1. Set the background image using the uploaded file reference
              backgroundImage: `url('${DASHBOARD_IMAGE_URL}')`,
              // 2. Position the image to show the right half (from the perspective of the image content)
              backgroundPosition: '50% center', 
              // 3. Zoom in to show only a portion and maintain aspect ratio
              backgroundSize: 'auto 100%', 
              backgroundColor: '#030303'
            }}
          >
            {/* Dark Gradient Overlay (Black to Transparent, coming from the right) */}
            <div 
              className="absolute inset-0 rounded-l-3xl"
              style={{
                // Adjusting gradient to fade from dark gray (matching the form side)
                background: 'linear-gradient(to right, rgba(17, 24, 39, 0.1) 0%,  #030303 90%)' 
              }}
            ></div>

            {/* Content for the image side (Marketing text) */}
            <div className="relative p-12 flex flex-col justify-end h-full text-white z-20">
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
                Your Next Level Awaits.
              </h1>
              <p className="text-gray-300 max-w-md">
                Access personalized progress tracking, peer auditing tools, and real-time project metrics in your unified dashboard.
              </p>
            </div>
          </div>
          
          {/* RIGHT COLUMN: Login Form (Full width on mobile, 1/2 width on large screens) */}
          <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#030303]/90 p-4 lg:p-12 backdrop-blur-sm">
            
            {/* Login Form Content */}
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-sm flex flex-col space-y-10"
            >
             <div className="space-y-3">
              
              <h2 className="text-4xl font-extrabold text-start text-white tracking-tight">
                Welcome to Abdulla01!
              </h2>
              <p className="text-start text-gray-400 text-md">
                Enter your credentials to continue.
              </p>
             </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition duration-300"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition duration-300"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <p className="text-red-400 text-sm text-center mt-2 animate-pulse">
                  {errorMessage}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 font-semibold rounded-xl transition-all duration-300 hover:from-lime-300 hover:to-lime-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-lime-500/30 focus:outline-none focus:ring-0 border-0"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
            
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
