"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Calculator } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function DividendDistribution({ campaignData, campaignAddress, onDistributionComplete }) {
  const [distributeForm, setDistributeForm] = useState({
    amount: "",
    token: "ETH",
    message: ""
  });
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState(null);

  const handleDistributeChange = (field, value) => {
    setDistributeForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const calculateDividendPerNFT = () => {
    const amount = parseFloat(distributeForm.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount / (campaignData?.nftTotal || 1)).toFixed(6);
  };

  const calculateTotalRecipients = () => {
    return campaignData?.investors || 0;
  };

  const handleDistributeDividends = async () => {
    if (!distributeForm.amount || parseFloat(distributeForm.amount) <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    setIsDistributing(true);
    setError(null);

    try {
      await apiManager.distributeDividends(
        campaignAddress, 
        distributeForm.amount, 
        distributeForm.message
      );
      
      setDistributeForm({ amount: "", token: "ETH", message: "" });
      
      if (onDistributionComplete) {
        onDistributionComplete();
      }
      
      // Success notification
      alert("Distribution réussie!");
      
    } catch (error) {
      console.error("Erreur lors de la distribution:", error);
      setError(error.message || "Erreur lors de la distribution des dividendes");
    } finally {
      setIsDistributing(false);
    }
  };

  const isFormValid = () => {
    return distributeForm.amount && 
           parseFloat(distributeForm.amount) > 0 && 
           !isDistributing;
  };

  return (
    <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-lime-500" />
          Distribution de Dividendes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
              <AlertTitle className="text-red-800 dark:text-red-200">Erreur</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="distributeAmount" className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Montant à distribuer *
            </Label>
            <div className="relative mt-1">
              <Input
                id="distributeAmount"
                type="number"
                step="0.000001"
                min="0"
                value={distributeForm.amount}
                onChange={(e) => handleDistributeChange('amount', e.target.value)}
                placeholder="0.000000"
                className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:border-lime-500 dark:focus:border-lime-400 pr-12"
                disabled={isDistributing}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">ETH</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="distributeToken" className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Token à distribuer
            </Label>
            <Select 
              onValueChange={(value) => handleDistributeChange('token', value)} 
              defaultValue={distributeForm.token}
              disabled={isDistributing}
            >
              <SelectTrigger className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 mt-1">
                <SelectValue placeholder="Sélectionnez un token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="distributeMessage" className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Message pour les investisseurs (optionnel)
            </Label>
            <Input
              id="distributeMessage"
              value={distributeForm.message}
              onChange={(e) => handleDistributeChange('message', e.target.value)}
              placeholder="Message accompagnant la distribution..."
              className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:border-lime-500 dark:focus:border-lime-400 mt-1"
              disabled={isDistributing}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {distributeForm.message.length}/200 caractères
            </p>
          </div>

          {distributeForm.amount && parseFloat(distributeForm.amount) > 0 && (
            <Alert className="bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800">
              <Calculator className="h-4 w-4 text-lime-600 dark:text-lime-400" />
              <AlertTitle className="text-lime-800 dark:text-lime-200">
                Aperçu de la distribution
              </AlertTitle>
              <AlertDescription className="text-lime-700 dark:text-lime-300 space-y-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Par NFT:</span>
                    <br />
                    <span className="text-lg font-bold">{calculateDividendPerNFT()} ETH</span>
                  </div>
                  <div>
                    <span className="font-medium">Total recipients:</span>
                    <br />
                    <span className="text-lg font-bold">{calculateTotalRecipients()} investisseurs</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-lime-200 dark:border-lime-700">
                  <span className="font-medium">Montant total: </span>
                  <span className="text-lg font-bold">{distributeForm.amount} ETH</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleDistributeDividends} 
            className="w-full bg-lime-500 hover:bg-lime-600 text-white font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={!isFormValid()}
          >
            {isDistributing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Distribution en cours...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Distribuer les Dividendes
              </div>
            )}
          </Button>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• La distribution sera automatiquement répartie entre tous les détenteurs de NFTs</p>
            <p>• Les frais de transaction seront déduits du montant envoyé</p>
            <p>• Cette action est irréversible</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}