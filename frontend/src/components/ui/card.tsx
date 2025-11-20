import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard card with padding, shadow, and rounded corners.
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl shadow-md bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}
