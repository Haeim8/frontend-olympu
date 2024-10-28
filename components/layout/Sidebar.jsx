import React from 'react';
import { Button } from "@/components/ui/button";
import { Home, Wallet, MessageSquare, Newspaper, Star, FileText, Upload } from "lucide-react";

const menuItems = [
  { icon: Home, title: 'Accueil', id: 'home' },
  { icon: Wallet, title: 'Portefeuille', id: 'wallet' },
  { icon: MessageSquare, title: 'Discussions', id: 'discussions' },
  { icon: Newspaper, title: 'Actualités', id: 'news' },
  { icon: Star, title: 'Favoris', id: 'favorites' },
  { icon: FileText, title: 'Campagne', id: 'campaign' },
];

export default function Sidebar({ showMobileMenu = true, activePage = 'home', setActivePage = () => {}, setShowMobileMenu = () => {} }) {
  const changePage = (page) => {
    setActivePage(page);
    setShowMobileMenu(false);
  };

  return (
    <aside className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-16 border-r-2 border-lime-400 flex-shrink-0 bg-white dark:bg-neutral-950 overflow-y-auto transition-all duration-300 ease-in-out`}>
      <nav className="flex flex-col p-4 space-y-4">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => changePage(item.id)}
            className={`justify-center w-full h-12 rounded-lg transition-all duration-200 ${
              activePage === item.id 
                ? 'bg-lime-100 dark:bg-lime-900 shadow-inner' 
                : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
            title={item.title}
          >
            <item.icon className={`h-5 w-5 ${
              activePage === item.id 
                ? 'text-lime-600 dark:text-lime-400' 
                : 'text-gray-600 dark:text-gray-400 group-hover:text-lime-600 dark:group-hover:text-lime-400'
            }`} />
          </Button>
        ))}
      </nav>
    </aside>
  );
}