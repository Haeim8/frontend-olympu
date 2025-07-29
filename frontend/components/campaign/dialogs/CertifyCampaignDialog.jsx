"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ShieldCheck, 
  User, 
  FileText, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Star,
  Award
} from 'lucide-react';

export default function CertifyCampaignDialog({ 
  isOpen, 
  onClose, 
  campaignData, 
  campaignAddress, 
  onSuccess 
}) {
  const [certificationForm, setCertificationForm] = useState({
    lawyerType: '',
    urgency: 'standard',
    documents: [],
    specialRequests: '',
    contactInfo: {
      email: '',
      phone: '',
      preferredContact: 'email'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  const certificationOptions = [
    {
      id: 'basic',
      name: 'Certification Basique',
      price: '0.05',
      duration: '3-5 jours ouvrés',
      lawyer: 'Avocat Junior Certifié',
      features: [
        'Vérification des documents légaux',
        'Conformité réglementaire de base',
        'Certificat de validation',
        'Support par email'
      ],
      color: 'blue',
      rating: 4.2,
      completedCases: 150
    },
    {
      id: 'premium',
      name: 'Certification Premium',
      price: '0.15',
      duration: '2-3 jours ouvrés',
      lawyer: 'Avocat Senior Spécialisé',
      features: [
        'Audit complet des documents',
        'Conformité réglementaire avancée',
        'Conseils personnalisés',
        'Certificat premium avec sceau',
        'Support téléphonique prioritaire'
      ],
      color: 'purple',
      popular: true,
      rating: 4.8,
      completedCases: 350
    },
    {
      id: 'enterprise',
      name: 'Certification Enterprise',
      price: '0.3',
      duration: '1-2 jours ouvrés',
      lawyer: 'Cabinet d\'Avocats Partenaire',
      features: [
        'Audit complet et détaillé',
        'Conformité internationale',
        'Rédaction de documents légaux',
        'Conseils stratégiques',
        'Accompagnement personnalisé',
        'Garantie de conformité'
      ],
      color: 'gold',
      rating: 4.9,
      completedCases: 200
    }
  ];

  const urgencyLevels = [
    { value: 'standard', label: 'Standard', extra: '+0 ETH' },
    { value: 'urgent', label: 'Urgent (24h)', extra: '+0.02 ETH' },
    { value: 'express', label: 'Express (12h)', extra: '+0.05 ETH' }
  ];

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCertificationForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCertificationForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLawyerSelect = (option) => {
    setSelectedLawyer(option);
    setCertificationForm(prev => ({ ...prev, lawyerType: option.id }));
  };

  const calculateTotalPrice = () => {
    if (!selectedLawyer) return '0';
    
    let basePrice = parseFloat(selectedLawyer.price);
    
    switch (certificationForm.urgency) {
      case 'urgent':
        basePrice += 0.02;
        break;
      case 'express':
        basePrice += 0.05;
        break;
    }
    
    return basePrice.toFixed(3);
  };

  const handleSubmitCertification = async () => {
    if (!selectedLawyer) return;
    
    setIsSubmitting(true);

    try {
      // Simulation de l'API call pour demander la certification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSuccess) {
        onSuccess({
          lawyer: selectedLawyer,
          form: certificationForm,
          totalPrice: calculateTotalPrice()
        });
      }

      onClose();
      alert(`Demande de certification soumise ! Un ${selectedLawyer.lawyer} vous contactera sous ${selectedLawyer.duration}.`);

    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert("Erreur lors de la soumission de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionColor = (colorType) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        badge: 'bg-blue-600'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-800 dark:text-purple-200',
        badge: 'bg-purple-600'
      },
      gold: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        badge: 'bg-gradient-to-r from-yellow-400 to-orange-500'
      }
    };
    return colors[colorType] || colors.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Certification Légale de votre Campagne
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerte d'information */}
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Pourquoi certifier votre campagne ?
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              La certification par un avocat augmente la confiance des investisseurs de 300% en moyenne et 
              garantit la conformité légale de votre projet selon les réglementations en vigueur.
            </AlertDescription>
          </Alert>

          {/* Options de certification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Choisissez votre niveau de certification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {certificationOptions.map((option) => {
                const colors = getOptionColor(option.color);
                const isSelected = selectedLawyer?.id === option.id;
                
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected ? `ring-2 ring-${option.color}-500 shadow-lg` : ''
                    } ${colors.bg} ${colors.border}`}
                    onClick={() => handleLawyerSelect(option)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        {option.popular && (
                          <Badge className="mb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Recommandé
                          </Badge>
                        )}
                        <h4 className={`text-xl font-bold ${colors.text} mb-2`}>
                          {option.name}
                        </h4>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <DollarSign className={`h-5 w-5 ${colors.text}`} />
                          <span className={`text-2xl font-bold ${colors.text}`}>
                            {option.price}
                          </span>
                          <span className={`text-sm ${colors.text}`}>ETH</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className={`text-sm font-medium ${colors.text}`}>
                              {option.rating}
                            </span>
                          </div>
                          <span className={`text-xs ${colors.text}`}>
                            ({option.completedCases} cas traités)
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Clock className={`h-4 w-4 ${colors.text}`} />
                          <span className={`text-sm ${colors.text}`}>
                            {option.duration}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-white dark:bg-neutral-800 rounded">
                          <User className={`h-4 w-4 ${colors.text}`} />
                          <span className={`text-xs font-medium ${colors.text}`}>
                            {option.lawyer}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-left">
                          {option.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                              <span className={colors.text}>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Configuration détaillée */}
          {selectedLawyer && (
            <div className="space-y-6 p-6 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Configuration de la certification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="urgency" className="text-gray-700 dark:text-gray-300 font-medium">
                    Niveau d'urgence
                  </Label>
                  <Select
                    value={certificationForm.urgency}
                    onValueChange={(value) => handleFormChange('urgency', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-neutral-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex justify-between w-full">
                            <span>{level.label}</span>
                            <span className="text-sm text-gray-500 ml-4">{level.extra}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium">
                    Prix Total
                  </Label>
                  <div className="mt-1 p-3 bg-white dark:bg-neutral-800 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {calculateTotalPrice()} ETH
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedLawyer.duration}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contact-email" className="text-gray-700 dark:text-gray-300 font-medium">
                    Email de contact *
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={certificationForm.contactInfo.email}
                    onChange={(e) => handleFormChange('contactInfo.email', e.target.value)}
                    placeholder="votre@email.com"
                    className="bg-white dark:bg-neutral-800 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-phone" className="text-gray-700 dark:text-gray-300 font-medium">
                    Téléphone (optionnel)
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={certificationForm.contactInfo.phone}
                    onChange={(e) => handleFormChange('contactInfo.phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="bg-white dark:bg-neutral-800 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special-requests" className="text-gray-700 dark:text-gray-300 font-medium">
                  Demandes spéciales ou points à vérifier
                </Label>
                <Textarea
                  id="special-requests"
                  value={certificationForm.specialRequests}
                  onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                  placeholder="Mentionnez des aspects spécifiques de votre projet que l'avocat devrait examiner..."
                  className="bg-white dark:bg-neutral-800 mt-1 h-24"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {certificationForm.specialRequests.length}/500 caractères
                </p>
              </div>

              {/* Résumé de la commande */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Résumé de votre commande
                </h4>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Service:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedLawyer.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avocat:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedLawyer.lawyer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Délai:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedLawyer.duration}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {calculateTotalPrice()} ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitCertification}
              disabled={!selectedLawyer || !certificationForm.contactInfo.email || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[180px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Soumission...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Demander la Certification
                </div>
              )}
            </Button>
          </div>

          {/* Garanties */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🛡️ Nos garanties :
            </p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Avocats certifiés et spécialisés en droit des cryptomonnaies</li>
              <li>• Confidentialité absolue de vos documents</li>
              <li>• Remboursement si les délais ne sont pas respectés</li>
              <li>• Support client disponible 24/7 pendant le processus</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}