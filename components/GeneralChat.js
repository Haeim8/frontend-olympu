// components/GeneralChat.js

import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useUser } from "./shared/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GeneralChat = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "chats", "general", "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    await addDoc(collection(db, "chats", "general", "messages"), {
      sender: user.username,
      content: newMessage,
      timestamp: new Date(),
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {msg.sender}:
            </span>
            <span className="text-gray-700 dark:text-gray-300 ml-2">
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSend}
        className="flex p-4 bg-gray-100 dark:bg-gray-800"
      >
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 p-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
        />
        <Button
          type="submit"
          className="ml-2 bg-lime-500 hover:bg-lime-600 text-white font-bold rounded-md"
        >
          Envoyer
        </Button>
      </form>
    </div>
  );
};

export default GeneralChat;
