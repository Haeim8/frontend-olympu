"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings
} from 'lucide-react';

export default function LiveVideoStream({ 
  isLive = false, 
  viewerCount = 0,
  onToggleLive,
  campaignData 
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Card className="w-full h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isLive ? (
              <Badge className="bg-red-500 text-white animate-pulse px-3 py-1">
                🔴 EN DIRECT
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-3 py-1">
                ⚫ HORS LIGNE
              </Badge>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{viewerCount.toLocaleString()} spectateurs</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 p-0"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={videoRef}
          className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer"
          onClick={toggleFullscreen}
        >
          {isLive ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative">
              {/* Simulation d'un stream live */}
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="text-center text-white z-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Play className="h-10 w-10 ml-1" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{campaignData?.name || 'Projet'}</h3>
                <p className="text-white/80 text-lg">Présentation en cours...</p>
                <div className="mt-4 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm inline-block">
                  <span className="text-sm">Session DAO Active</span>
                </div>
              </div>
              
              {/* Indicateurs de qualité */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                  HD 1080p
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  60 FPS
                </Badge>
              </div>
              
              {/* Barre de progression temps */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/20 rounded-full h-1 overflow-hidden">
                  <div className="bg-red-500 h-full w-1/3 animate-pulse"></div>
                </div>
                <div className="flex justify-between text-xs text-white/80 mt-1">
                  <span>05:32</span>
                  <span>15:00 min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pause className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Session en attente</h3>
                <p className="text-gray-500">Le live démarrera bientôt...</p>
                <div className="mt-4">
                  <Badge variant="outline" className="text-gray-500">
                    Prochaine session programmée
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {/* Overlay de contrôles (visible au hover) */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex gap-4">
              {isLive && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  <Pause className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}