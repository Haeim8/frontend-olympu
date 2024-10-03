'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from '@/components/shared/UserContext';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function GeneralChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useUser();

  useEffect(() => {
    const q = query(collection(db, "generalChat"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(fetchedMessages.reverse());
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "generalChat"), {
        text: newMessage,
        username: user.username,
        timestamp: new Date(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message : ", error);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-grow mb-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-bold text-gray-900 dark:text-gray-100">{msg.username}: </span>
            <span className="text-gray-700 dark:text-gray-300">{msg.text}</span>
          </div>
        ))}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="flex-grow bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-white">Envoyer</Button>
      </form>
    </div>
  );
}