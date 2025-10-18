// components/WelcomeOverlay.jsx
import React from "react";
import BlurText from "./BlurText"; // Keep the original import structure

export default function WelcomeOverlay({ showWelcome, username }) {
  if (!username) return null; // Safety check

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-xl transition-opacity duration-1000 ease-in-out pointer-events-none`}
      style={{ opacity: showWelcome ? 1 : 0 }}
    >
      <div className="text-center">
        <BlurText
          text={`Welcome Back ${username}`}
          delay={300}
          animateBy="words"
          direction="top"
          className="text-7xl md:text-6xl font-extrabold text-white tracking-tighter"
        />
      </div>
    </div>
  );
}