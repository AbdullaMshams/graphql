import React from "react";

const BentoCard = ({ title, subtitle, children, onClick, className = "" }) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col justify-between 
        hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg transition-transform duration-200 cursor-pointer ${className}`}
    >
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default BentoCard;
