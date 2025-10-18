// components/LoadingOverlay.jsx
import React from "react";
import ProgressBar from "./ProgressBar"; // Import the new component

export default function LoadingOverlay({ isFetching, progress }) {
  if (!isFetching) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-xl transition-all duration-500 p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-wider mb-4">
          Initializing Dashboard
        </h1>
      </div>

      <ProgressBar
        aria-label="Loading dashboard"
        className="max-w-sm"
        value={progress}
      />

      <p className="mt-4 text-sm font-medium text-gray-400">
        {progress}% Complete
      </p>
    </div>
  );
}