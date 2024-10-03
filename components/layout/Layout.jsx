import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children, ...props }) {
  return (
    <div className="flex flex-col h-screen">
      <Header {...props} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar {...props} />
        <main className="flex-1 p-4 md:p-8 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}