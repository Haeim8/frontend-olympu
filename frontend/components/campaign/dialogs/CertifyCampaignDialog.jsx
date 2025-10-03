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
import { useTranslation } from '@/hooks/useLanguage';
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
  const { t } = useTranslation();
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
      name: t('certify.basic.name'),
      price: '0.05',
      duration: t('certify.basic.duration'),
      lawyer: t('certify.basic.lawyer'),
      features: [
        t('certify.basic.feature1'),
        t('certify.basic.feature2'),
        t('certify.basic.feature3'),
        t('certify.basic.feature4')
      ],
      color: 'blue',
      rating: 4.2,
      completedCases: 150
    },
    {
      id: 'premium',
      name: t('certify.premium.name'),
      price: '0.15',
      duration: t('certify.premium.duration'),
      lawyer: t('certify.premium.lawyer'),
      features: [
        t('certify.premium.feature1'),
        t('certify.premium.feature2'),
        t('certify.premium.feature3'),
        t('certify.premium.feature4'),
        t('certify.premium.feature5')
      ],
      color: 'purple',
      popular: true,
      rating: 4.8,
      completedCases: 350
    },
    {
      id: 'enterprise',
      name: t('certify.enterprise.name'),
      price: '0.3',
      duration: t('certify.enterprise.duration'),
      lawyer: t('certify.enterprise.lawyer'),
      features: [
        t('certify.enterprise.feature1'),
        t('certify.enterprise.feature2'),
        t('certify.enterprise.feature3'),
        t('certify.enterprise.feature4'),
        t('certify.enterprise.feature5'),
        t('certify.enterprise.feature6')
      ],
      color: 'gold',
      rating: 4.9,
      completedCases: 200
    }
  ];

  const urgencyLevels = [
    { value: 'standard', label: t('certify.urgency.standard'), extra: '+0 ETH' },
    { value: 'urgent', label: t('certify.urgency.urgent'), extra: '+0.02 ETH' },
    { value: 'express', label: t('certify.urgency.express'), extra: '+0.05 ETH' }
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
      alert(t('certify.successMessage', { lawyer: selectedLawyer.lawyer, duration: selectedLawyer.duration }));

    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert(t('certify.errorMessage'));
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
            <ShieldCheck className="h-5 w-5 text-lime-500" />
            {t('certify.dialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerte d'information */}
          <Alert className="bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800">
            <Info className="h-4 w-4 text-lime-600 dark:text-lime-400" />
            <AlertTitle className="text-lime-800 dark:text-lime-200">
              {t('certify.whyTitle')}
            </AlertTitle>
            <AlertDescription className="text-lime-700 dark:text-lime-300">
              {t('certify.whyDescription')}
            </AlertDescription>
          </Alert>

          {/* Options de certification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('certify.chooseLevel')}
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
                          <Badge className="mb-2 bg-gradient-to-r from-lime-500 to-green-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            {t('certify.recommended')}
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
                            ({option.completedCases} {t('certify.casesProcessed')})
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
            <div className="space-y-6 p-6 bg-lime-50/50 dark:bg-lime-900/10 rounded-lg border border-lime-200 dark:border-lime-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('certify.configuration')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="urgency" className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('certify.urgencyLevel')}
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
                    {t('certify.totalPrice')}
                  </Label>
                  <div className="mt-1 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-lime-200 dark:border-lime-700">
                    <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
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
                    {t('certify.contactEmail')} *
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={certificationForm.contactInfo.email}
                    onChange={(e) => handleFormChange('contactInfo.email', e.target.value)}
                    placeholder={t('certify.contactEmailPlaceholder')}
                    className="bg-white dark:bg-neutral-800 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-phone" className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('certify.contactPhone')}
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={certificationForm.contactInfo.phone}
                    onChange={(e) => handleFormChange('contactInfo.phone', e.target.value)}
                    placeholder={t('certify.contactPhonePlaceholder')}
                    className="bg-white dark:bg-neutral-800 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special-requests" className="text-gray-700 dark:text-gray-300 font-medium">
                  {t('certify.specialRequests')}
                </Label>
                <Textarea
                  id="special-requests"
                  value={certificationForm.specialRequests}
                  onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                  placeholder={t('certify.specialRequestsPlaceholder')}
                  className="bg-white dark:bg-neutral-800 mt-1 h-24"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('certify.charactersCount', { count: certificationForm.specialRequests.length })}
                </p>
              </div>

              {/* Résumé de la commande */}
              <div className="border-t border-lime-200 dark:border-lime-800 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t('certify.orderSummary')}
                </h4>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg space-y-2 border border-lime-200 dark:border-lime-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('certify.service')}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedLawyer.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('certify.lawyer')}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedLawyer.lawyer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('certify.delay')}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedLawyer.duration}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-lime-200 dark:border-lime-700 pt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">{t('certify.total')}</span>
                    <span className="text-xl font-bold text-lime-600 dark:text-lime-400">
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
              className="hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmitCertification}
              disabled={!selectedLawyer || !certificationForm.contactInfo.email || isSubmitting}
              className="bg-lime-600 hover:bg-lime-700 text-white min-w-[180px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('certify.submitting')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {t('certify.submit')}
                </div>
              )}
            </Button>
          </div>

          {/* Garanties */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg border border-lime-200 dark:border-lime-800">
            <p className="font-medium text-lime-800 dark:text-lime-200 mb-2">
              {t('certify.guaranteesTitle')}
            </p>
            <ul className="space-y-1 text-lime-700 dark:text-lime-300">
              <li>{t('certify.guarantee1')}</li>
              <li>{t('certify.guarantee2')}</li>
              <li>{t('certify.guarantee3')}</li>
              <li>{t('certify.guarantee4')}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
