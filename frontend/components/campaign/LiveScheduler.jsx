"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  AlertCircle,
  CheckCircle,
  Play,
  Bell,
  Settings
} from 'lucide-react';

export default function LiveScheduler({ 
  campaignData, 
  onScheduleLive, 
  onStartLive 
}) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSession, setScheduledSession] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    title: '',
    description: '',
    notifyInvestors: true
  });

  // Session exemple déjà programmée
  const exampleSession = {
    id: 1,
    date: '2024-02-15',
    time: '14:00',
    title: 'Présentation Q1 2024 - Avancement Produit',
    description: 'Présentation des développements du trimestre et roadmap Q2',
    status: 'scheduled', // scheduled, active, completed
    notificationsCount: 35
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSchedule = () => {
    if (!formData.date || !formData.time || !formData.title) return;
    
    const newSession = {
      id: Date.now(),
      ...formData,
      status: 'scheduled',
      notificationsCount: 0
    };
    
    setScheduledSession(newSession);
    onScheduleLive && onScheduleLive(newSession);
    setIsScheduling(false);
    setFormData({ date: '', time: '', title: '', description: '', notifyInvestors: true });
  };

  const handleStartLive = () => {
    onStartLive && onStartLive();
  };

  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSessionToday = (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Au moins 1h à l'avance
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-purple-500" />
          Sessions Live DAO
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Session programmée existante (exemple) */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Sessions programmées
          </h3>
          
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  {exampleSession.title}
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {formatDateTime(exampleSession.date, exampleSession.time)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500 text-white">
                  Programmé
                </Badge>
                {isSessionToday(exampleSession.date) && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Aujourd'hui
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {exampleSession.description}
            </p>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{campaignData?.nftHolders || 40} holders notifiés</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Bell className="h-4 w-4" />
                  <span>{exampleSession.notificationsCount} notifications envoyées</span>
                </div>
              </div>
              
              {isSessionToday(exampleSession.date) && (
                <Button 
                  onClick={handleStartLive}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Démarrer le Live
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire de programmation */}
        {!isScheduling ? (
          <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Programmer une nouvelle session live
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Organisez une session de gouvernance DAO pour débloquer les fonds
            </p>
            <Button 
              onClick={() => setIsScheduling(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Programmer une session
            </Button>
          </div>
        ) : (
          <div className="space-y-4 bg-gray-50 dark:bg-neutral-800 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Nouvelle session live
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date de la session *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="time">Heure de début *</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="title">Titre de la session *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Présentation Q1 2024 - Avancement Produit"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez ce que vous allez présenter..."
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p><strong>Rappel important :</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Durée minimum obligatoire : <strong>15 minutes</strong></li>
                    <li>Les holders NFT peuvent voter pour récupérer 85% des fonds</li>
                    <li>1 NFT = 1 vote par wallet (gouvernance équitable)</li>
                    <li>Session obligatoire pour débloquer les fonds</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsScheduling(false)}
              >
                Annuler
              </Button>
              
              <Button 
                onClick={handleSchedule}
                disabled={!formData.date || !formData.time || !formData.title}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Programmer la session
              </Button>
            </div>
          </div>
        )}

        {/* Informations sur les sessions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p><strong>💡 Conseils pour une session réussie :</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Préparez un support visuel (slides, démo)</li>
                <li>Présentez les réalisations concrètes</li>
                <li>Répondez aux questions des investisseurs</li>
                <li>Montrez la roadmap future claire</li>
                <li>Soyez transparent sur les difficultés</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}