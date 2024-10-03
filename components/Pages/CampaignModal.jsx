import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Upload, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CampaignModal({ showCreateCampaign, setShowCreateCampaign, handleCreateCampaign }) {
  const [campaignForm, setCampaignForm] = useState({
    campaignName: '',
    startup: '',
    sharePrice: '',
    totalShares: '',
    endTime: '',
    sector: '',
    description: '',
    lawyer: false,
    lawyerWallet: '',
    lawyerContact: '',
    lawyerFirm: '',
    lawyerInfo: '',
    termsAccepted: false,
    documents: []
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setCampaignForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newDocuments = Array.from(e.target.files);
      setCampaignForm(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocuments]
      }));
    }
  };

  const removeDocument = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateCampaign(campaignForm);
  };

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="bg-white dark:bg-gray-950 text-black dark:text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            Créer une nouvelle campagne
          </DialogTitle>
        </DialogHeader>
        <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <InfoIcon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Information importante</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            L'application applique une commission de 15% sur tout achat de la campagne.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaignName" className="text-gray-800 dark:text-gray-200">Nom de la campagne</Label>
            <Input
              id="campaignName"
              name="campaignName"
              value={campaignForm.campaignName}
              onChange={handleInputChange}
              required
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="startup" className="text-gray-800 dark:text-gray-200">Adresse de la startup</Label>
            <Input
              id="startup"
              name="startup"
              value={campaignForm.startup}
              onChange={handleInputChange}
              required
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="sector" className="text-gray-800 dark:text-gray-200">Secteur d'activité</Label>
            <Select name="sector" onValueChange={(value) => handleSelectChange("sector", value)}>
              <SelectTrigger className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Sélectionnez un secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Technologie</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="health">Santé</SelectItem>
                <SelectItem value="education">Éducation</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-800 dark:text-gray-200">Description du projet</Label>
            <Textarea
              id="description"
              name="description"
              value={campaignForm.description}
              onChange={handleInputChange}
              required
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="sharePrice" className="text-gray-800 dark:text-gray-200">Prix par part (en USDC)</Label>
            <Input
              id="sharePrice"
              name="sharePrice"
              type="number"
              value={campaignForm.sharePrice}
              onChange={handleInputChange}
              required
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="totalShares" className="text-gray-800 dark:text-gray-200">Nombre total de parts</Label>
            <Input
              id="totalShares"
              name="totalShares"
              type="number"
              value={campaignForm.totalShares}
              onChange={handleInputChange}
              required
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="endTime" className="text-gray-800 dark:text-gray-200">Date de fin</Label>
            <Input
              id="endTime"
              name="endTime"
              type="datetime-local"
              value={campaignForm.endTime}
              onChange={handleInputChange}
              required
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="documents" className="text-gray-800 dark:text-gray-200">Documents de la campagne</Label>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="documents"
                name="documents"
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('documents')?.click()}
                className="bg-lime-500 hover:bg-lime-600 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {campaignForm.documents.length} fichier(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.documents.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-50 dark:bg-gray-900">
                {campaignForm.documents.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lawyer"
              name="lawyer"
              checked={campaignForm.lawyer}
              onCheckedChange={(checked) => setCampaignForm(prev => ({ ...prev, lawyer: checked }))}
              className="text-lime-500 dark:text-lime-400"
            />
            <Label htmlFor="lawyer" className="text-gray-800 dark:text-gray-200">Campagne avec avocat</Label>
          </div>
          {campaignForm.lawyer && (
            <>
              <div>
                <Label htmlFor="lawyerWallet" className="text-gray-800 dark:text-gray-200">Adresse du portefeuille de l'avocat</Label>
                <Input
                  id="lawyerWallet"
                  name="lawyerWallet"
                  value={campaignForm.lawyerWallet}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="lawyerContact" className="text-gray-800 dark:text-gray-200">Contact de l'avocat</Label>
                <Input
                  id="lawyerContact"
                  name="lawyerContact"
                  value={campaignForm.lawyerContact}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="lawyerFirm" className="text-gray-800 dark:text-gray-200">Cabinet d'avocats</Label>
                <Input
                  id="lawyerFirm"
                  name="lawyerFirm"
                  value={campaignForm.lawyerFirm}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="lawyerInfo" className="text-gray-800 dark:text-gray-200">Informations supplémentaires sur l'avocat</Label>
                <Textarea
                  id="lawyerInfo"
                  name="lawyerInfo"
                  value={campaignForm.lawyerInfo}
                  onChange={handleInputChange}
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
            </>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="termsAccepted"
              name="termsAccepted"
              checked={campaignForm.termsAccepted}
              onCheckedChange={(checked) => setCampaignForm(prev => ({ ...prev, termsAccepted: checked }))}
              required
              className="text-lime-500 dark:text-lime-400"
            />
            <Label htmlFor="termsAccepted" className="text-gray-800 dark:text-gray-200">
              J'accepte les conditions générales d'utilisation et je décharge l'application de toute responsabilité
            </Label>
          </div>
          <Button type="submit" className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold" disabled={!campaignForm.termsAccepted}>
            Créer la campagne
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}