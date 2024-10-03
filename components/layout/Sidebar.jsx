import React from 'react';
import { Button } from "@/components/ui/button";
import { Home, Wallet, MessageSquare, Newspaper, Star, FileText } from "lucide-react";

export default function Sidebar({ showMobileMenu, activePage, setActivePage, setShowMobileMenu }) {
  const changePage = (page) => {
    setActivePage(page);
    setShowMobileMenu(false);
  };

  return (
    <aside className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-16 border-r flex-shrink-0 bg-white dark:bg-gray-950 dark:border-gray-800 overflow-y-auto`}>
      <nav className="flex flex-col p-4 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changePage('home')}
          className={`justify-center ${activePage === 'home' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
          title="Accueil">
          <Home className="h-5 w-5 text-lime-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changePage('wallet')}
          className={`justify-center ${activePage === 'wallet' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
          title="Portefeuille">
          <Wallet className="h-5 w-5 text-lime-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changePage('discussions')}
          className={`justify-center ${activePage === 'discussions' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
          title="Discussions">
          <MessageSquare className="h-5 w-5 text-lime-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changePage('news')}
          className={`justify-center ${activePage === 'news' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
          title="Actualités">
          <Newspaper className="h-5 w-5 text-lime-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changePage('favorites')}
          className={`justify-center ${activePage === 'favorites' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
          title="Favoris">
          <Star className="h-5 w-5 text-lime-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changePage('campaign')}
          className={`justify-center ${activePage === 'campaign' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
          title="Campagne">
          <FileText className="h-5 w-5 text-lime-400" />
        </Button>
      </nav>
    </aside>
  );
}