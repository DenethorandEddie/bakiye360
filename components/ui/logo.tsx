import React from "react";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v20M17 5h-5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0 7H6" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
