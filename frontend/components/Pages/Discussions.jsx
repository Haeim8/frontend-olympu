'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from '@/components/shared/UserContext';
import GeneralChat from '@/components/shared/GeneralChat';
import CampaignChat from '@/components/shared/CampaignChat';

export default function Discussions({ projects = [] }) {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Discussions</h2>
      {/* Chat Général */}
      <Card className="bg-white dark:bg-neutral-950 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chat Général</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralChat />
        </CardContent>
      </Card>
      {/* Chats des Campagnes */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats des Campagnes</h3>
      {/* Liste des Chats des Campagnes */}
      {projects.length > 0 ? (
        projects.map((project) => (
          <CampaignChat key={project.id} project={project} />
        ))
      ) : (
        <p className="text-gray-700 dark:text-gray-300">Aucune campagne disponible pour le moment.</p>
      )}
    </div>
  );
}