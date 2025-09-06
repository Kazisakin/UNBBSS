'use client';

import React from 'react';

export const CookiePreferencesButton = ({
  onClick,
  className = '',
  text = 'Update Cookie Preferences',
}: {
  onClick?: () => void;
  className?: string;
  text?: string;
}) => {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unbbss_cookie_consent');
      if (onClick) onClick(); 
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 shadow-lg ${className}`}
      aria-label="Update cookie preferences and reload page"
    >
      {text}
    </button>
  );
};