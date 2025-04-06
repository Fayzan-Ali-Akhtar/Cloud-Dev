import React from 'react';

const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  return (
    <div className={`${className} flex justify-center items-center`}>
      <div className={`${sizeClasses[size]} rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin-slow`}></div>
    </div>
  );
};

export default LoadingSpinner;