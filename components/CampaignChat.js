// components/CampaignChat.js

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useUser } from './shared/UserContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useNFTGroupManagement from '../lib/hooks/useNFTGroupManagement';

const CampaignChat = ({ project }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  // Utiliser le hook pour gérer l'accès
  useNFTGroupManagement(project.id);

  useEffect(() => {
    const checkAccess = async () => {
      const campaignDoc = await getDoc(doc(db, "campaigns", project.id.toString()));
      if (campaignDoc.exists()) {
        const investors = campaignDoc.data().investors || [];
        setHasAccess(investors.includes(user.uid));
      }
    };
    checkAccess();
  }, [project.id, user.uid]);

  useEffect(() => {
    if (!hasAccess) return;

    const chatId = `campaign_${project.id}`;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [hasAccess, project.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const chatId = `campaign_${project.id}`;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      sender: user.username,
      content: newMessage,
      timestamp: new Date()
    });

    setNewMessage('');
  };

  if (!hasAccess) return null;

  return (
    <Card className="bg-white dark:bg-gray-950 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name} - Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-64">
        <div className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900">
          {messages.map(msg => (
            <div key={msg.id} className="mb-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{msg.sender}:</span> 
              <span className="text-gray-700 dark:text-gray-300 ml-2">{msg.content}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex p-2 bg-gray-100 dark:bg-gray-800">
          <Input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 p-1 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
          />
          <Button type="submit" className="ml-2 bg-lime-500 hover:bg-lime-600 text-white font-bold rounded-md">
            Envoyer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CampaignChat;
