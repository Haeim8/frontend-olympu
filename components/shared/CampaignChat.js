'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from '../shared/UserContext'; // Assurez-vous que ce contexte passe bien les infos utilisateur
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Send } from 'lucide-react';

export default function CampaignChat({ project }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useUser(); // On récupère l'utilisateur depuis le contexte

  useEffect(() => {
    const q = query(collection(db, `projects/${project.id}/chat`), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(fetchedMessages.reverse());
    });

    return () => unsubscribe();
  }, [project.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, `projects/${project.id}/chat`), {
        text: newMessage,
        username: user?.username || 'Utilisateur', // On utilise le pseudo, sinon "Utilisateur"
        timestamp: new Date(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-grow mb-4 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-4 ${msg.username === user?.username ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.username === user?.username 
                ? 'bg-lime-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            }`}>
              <p className="font-bold">{msg.username}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-b-xl">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="flex-grow bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full"
        />
        <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-white rounded-full px-6">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
