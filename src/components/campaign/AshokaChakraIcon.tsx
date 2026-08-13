import React from "react";

interface AshokaChakraIconProps {
  className?: string;
  size?: number;
}

export const AshokaChakraIcon: React.FC<AshokaChakraIconProps> = ({ className = "text-blue-900 dark:text-blue-400", size = 24 }) => {
  const spokes = Array.from({ length: 24 });
  const radius = 40;
  const cx = 50;
  const cy = 50;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ashoka Chakra"
    >
      {/* Outer Circle */}
      <circle cx={cx} cy={cy} r="45" stroke="currentColor" strokeWidth="4" />
      {/* Inner Hub Circle */}
      <circle cx={cx} cy={cy} r="8" stroke="currentColor" strokeWidth="3" fill="currentColor" />
      
      {/* 24 Spokes */}
      {spokes.map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x2 = cx + radius * Math.cos(rad);
        const y2 = cy + radius * Math.sin(rad);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};
