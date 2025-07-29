"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Shield, 
  User,
  Crown,
  Zap
} from 'lucide-react';

export default function DecentralizedChat({ campaignAddress, isLive = true }) {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      address: "0x742d35Cc6a7590C2b68de7418fd3c464988c0C56", 
      message: "Excited about this project! 🚀", 
      timestamp: new Date(Date.now() - 300000),
      type: "investor"
    },
    { 
      id: 2, 
      address: "0x892Ff24a6b2C8F1f9b4B7d3c5F8D9E0B4C6A8B5A", 
      message: "When will you start shipping the first products?", 
      timestamp: new Date(Date.now() - 240000),
      type: "investor"
    },
    { 
      id: 3, 
      address: campaignAddress, 
      message: "Thanks for joining! We're shipping Q2 2024 📦", 
      timestamp: new Date(Date.now() - 200000),
      type: "creator"
    },
    { 
      id: 4, 
      address: "0x123bE35Ac6b7590C2b68de7418fd3c464988c0789", 
      message: "Great presentation so far", 
      timestamp: new Date(Date.now() - 180000),
      type: "investor"
    },
    { 
      id: 5, 
      address: "0x456d35Cc6a7590C2b68de7418fd3c464988c0def", 
      message: "I'm keeping my NFT! 💎🙌", 
      timestamp: new Date(Date.now() - 120000),
      type: "investor"
    }
  ]);
  
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(24);
  const messagesEndRef = useRef(null);
  const address = useAddress();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const shortenAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getUserType = (msgAddress) => {
    if (msgAddress === campaignAddress) return 'creator';
    if (msgAddress === address) return 'self';
    return 'investor';
  };

  const getUserIcon = (type) => {
    switch (type) {
      case 'creator':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'self':
        return <User className="h-3 w-3 text-blue-500" />;
      default:
        return <Shield className="h-3 w-3 text-gray-500" />;
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && address && isLive) {
      const message = {
        id: messages.length + 1,
        address,
        message: newMessage.trim(),
        timestamp: new Date(),
        type: getUserType(address)
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Chat Décentralisé
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <Zap className="h-3 w-3 mr-1" />
              XMTP
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {onlineUsers} en ligne
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 mb-4 pr-4">
          <div className="space-y-3">
            {messages.map((msg) => {
              const userType = getUserType(msg.address);
              const isCreator = userType === 'creator';
              const isSelf = userType === 'self';
              
              return (
                <div 
                  key={msg.id} 
                  className={`rounded-lg p-3 ${
                    isCreator 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800' 
                      : isSelf 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getUserIcon(userType)}
                      <span className={`text-xs font-mono ${
                        isCreator 
                          ? 'text-yellow-700 dark:text-yellow-400 font-bold' 
                          : isSelf
                            ? 'text-blue-700 dark:text-blue-400 font-bold'
                            : 'text-lime-600 dark:text-lime-400'
                      }`}>
                        {isCreator ? 'Fondateur' : isSelf ? 'Vous' : shortenAddress(msg.address)}
                      </span>
                      {isCreator && (
                        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Créateur
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    isCreator 
                      ? 'text-yellow-900 dark:text-yellow-100 font-medium' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {msg.message}
                  </p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Formulaire d'envoi */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={isLive ? "Tapez votre message..." : "Chat fermé - Live inactif"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isLive || !address}
              className="flex-1"
              maxLength={200}
            />
            <Button 
              onClick={sendMessage} 
              size="sm"
              disabled={!newMessage.trim() || !isLive || !address}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Indicateurs d'état */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Chat actif
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Chat fermé
                </span>
              )}
              {!address && (
                <span className="text-amber-600">
                  Connectez votre wallet pour participer
                </span>
              )}
            </div>
            {newMessage && (
              <span className={`${newMessage.length > 180 ? 'text-red-500' : 'text-gray-400'}`}>
                {newMessage.length}/200
              </span>
            )}
          </div>
        </div>

        {/* Règles du chat */}
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Règles:</strong> Restez respectueux • Pas de spam • Questions pertinentes seulement
        </div>
      </CardContent>
    </Card>
  );
}