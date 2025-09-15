import React from "react";

/**
 * MagicBentoGrid – a flexible grid layout inspired by reactbits.dev
 *
 * Props:
 * - children: the cards (divs or components)
 * - className: additional styling
 */
const MagicBentoGrid = ({ children, className = "" }) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] gap-4 p-6 bg-[#0E0B16] ${className}`}
    >
      {children}
    </div>
  );
};

export default MagicBentoGrid;
