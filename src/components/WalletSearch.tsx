"use client";

import { useState } from "react";

interface WalletSearchProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

export default function WalletSearch({ onSearch, isLoading }: WalletSearchProps) {
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed.length >= 32) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-gray-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Solana wallet address..."
          className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl pl-12 pr-36 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF] transition-all text-sm font-mono"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={isLoading || address.trim().length < 32}
          className="absolute right-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            color: "#000",
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading
            </span>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
    </form>
  );
}
