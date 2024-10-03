import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function News() {
  // Placeholder data for news items
  const newsItems = [
    { id: 1, title: "Nouvelle réglementation crypto en Europe", date: "2023-09-01" },
    { id: 2, title: "Record de levée de fonds pour une startup blockchain", date: "2023-08-28" },
    { id: 3, title: "Adoption croissante des NFTs dans l'industrie du jeu", date: "2023-08-25" },
  ];

  return (
    <Card className="bg-white dark:bg-gray-950 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Actualités</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {newsItems.map((item) => (
            <li key={item.id} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-b-0 last:pb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.date}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}