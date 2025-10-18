// components/ProgressBar.jsx
import React from "react";

const ProgressBar = ({ value, className, "aria-label": ariaLabel }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={`w-full bg-gray-700/50 rounded-full h-2.5 shadow-inner overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={ariaLabel}
    >
      <div
        className="h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={{
          width: `${clampedValue}%`,
          background: ` #c9f24d `,
        }}
      ></div>
    </div>
  );
};

export default ProgressBar;