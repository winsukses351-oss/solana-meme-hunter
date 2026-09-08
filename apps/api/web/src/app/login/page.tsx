'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!res.ok) throw new Error('Invalid authentication credentials');

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center p-4">
      <div className="bg-cardBg border border-cardBorder w-full max-w-md rounded-xl p-6 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-cardBorder p-3 rounded-full mb-2">
            <Lock className="h-6 w-6 text-accentGreen" />
          </div>
          <h1 className="text-xl font-bold text-white">System Authentication</h1>
          <p className="text-xs text-gray-400 mt-1">Solana Autonomous Meme Coin Trader</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-darkBg border border-cardBorder rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-accentGreen"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-darkBg border border-cardBorder rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-accentGreen"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accentGreen hover:bg-emerald-600 text-black font-bold py-3 rounded-lg text-sm transition-all min-h-[48px]"
          >
            AUTHENTICATE & ENTER
          </button>
        </form>
      </div>
    </div>
  );
}
