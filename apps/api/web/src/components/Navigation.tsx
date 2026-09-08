'use client';

import React from 'react';
import { Activity, ShieldAlert, Settings, LogOut } from 'lucide-react';

export const Navigation: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-cardBg border-b border-cardBorder px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-accentGreen" />
        <span className="font-bold text-lg tracking-wide text-white">SOLANA AUTONOMOUS</span>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-white rounded-lg bg-cardBorder/50"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};
