// components/shared/UserDropdown.jsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export default function UserDropdown({ user, isDropdownOpen, setIsDropdownOpen, disconnect }) {
  return (
    <div className="relative" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
      <Button
        variant="ghost"
        className="flex items-center space-x-2 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />
        <span className="text-gray-900 dark:text-gray-100">{user?.username || 'Utilisateur'}</span>
        <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      </Button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-950 rounded-md shadow-lg z-10">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Solde des Tokens</h3>
          </div>
          <div className="p-4 space-y-2">
            {/* Afficher les soldes ici */}
          </div>
          <div className="p-4">
            <Button
              onClick={() => { disconnect(); setIsDropdownOpen(false); }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              Déconnecter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
