import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Upload, Plus, Minus } from 'lucide-react';

export default function CampaignModal({ showCreateCampaign, setShowCreateCampaign, handleCreateCampaign }) {
  const [campaignForm, setCampaignForm] = useState({
    creatorAddress: '',
    name: '',
    sector: '',
    description: '',
    sharePrice: '',
    totalShares: '',
    goal: '',
    endDate: '',
    documents: [],
    media: [],
    teamMembers: [{ name: '', role: '', twitter: '', facebook: '' }],
    hasLawyer: false,
    lawyer: {
      name: '',
      contact: '',
      phone: ''
    },
    investmentTerms: {
      remunerationType: '',
      roi: '',
      nativeTokenDistribution: false
    },
    companyShares: {
      percentageMinted: '',
      vertePortalLink: ''
    },
    acceptTerms: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e, nestedField) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [nestedField]: {
        ...prev[nestedField],
        [name]: value
      }
    }));
  };

  const handleSelectChange = (value, field) => {
    setCampaignForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (name, nestedField = null) => {
    if (nestedField) {
      setCampaignForm(prev => ({
        ...prev,
        [nestedField]: {
          ...prev[nestedField],
          [name]: !prev[nestedField][name]
        }
      }));
    } else {
      setCampaignForm(prev => ({ ...prev, [name]: !prev[name] }));
    }
  };

  const handleFileChange = (e, field) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCampaignForm(prev => ({
        ...prev,
        [field]: [...prev[field], ...newFiles]
      }));
    }
  };

  const removeFile = (index, field) => {
    setCampaignForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addTeamMember = () => {
    setCampaignForm(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '', twitter: '', facebook: '' }]
    }));
  };

  const removeTeamMember = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setCampaignForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!campaignForm.acceptTerms) {
      alert("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }
    handleCreateCampaign(campaignForm);
  };

  const InfoTooltip = ({ content }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className="p-0 h-4 w-4 rounded-full">
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Créer une nouvelle campagne</DialogTitle>
        </DialogHeader>
        <Alert className="mb-6 bg-red-900 border-red-700 text-white">
          <Info className="h-4 w-4" />
          <AlertDescription>
            L'application applique une commission de 15% sur tout achat de la campagne.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasLawyer"
              checked={campaignForm.hasLawyer}
              onCheckedChange={() => handleCheckboxChange('hasLawyer')}
            />
            <Label htmlFor="hasLawyer">Campagne avec avocat</Label>
            <InfoTooltip content="Cochez cette case si votre campagne est assistée par un avocat." />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="creatorAddress">Adresse du créateur</Label>
              <InfoTooltip content="Entrez l'adresse Ethereum du créateur de la campagne." />
            </div>
            <Input
              id="creatorAddress"
              name="creatorAddress"
              value={campaignForm.creatorAddress}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="name">Nom de la campagne</Label>
              <InfoTooltip content="Donnez un nom unique et descriptif à votre campagne." />
            </div>
            <Input
              id="name"
              name="name"
              value={campaignForm.name}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="sector">Secteur d'activité</Label>
              <InfoTooltip content="Choisissez le secteur qui correspond le mieux à votre projet." />
            </div>
            <Select onValueChange={(value) => handleSelectChange(value, 'sector')} required>
              <SelectTrigger className="bg-gray-100 dark:bg-gray-800">
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
            <div className="flex items-center space-x-2">
              <Label htmlFor="description">Description du projet</Label>
              <InfoTooltip content="Décrivez votre projet en détail. Soyez clair et concis." />
            </div>
            <Textarea
              id="description"
              name="description"
              value={campaignForm.description}
              onChange={handleInputChange}
              placeholder="Veuillez renseigner ce champ."
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="sharePrice">Prix par part (en USDC)</Label>
              <InfoTooltip content="Définissez le prix d'une part de votre projet en USDC." />
            </div>
            <Input
              id="sharePrice"
              name="sharePrice"
              type="number"
              value={campaignForm.sharePrice}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="totalShares">Nombre total de parts</Label>
              <InfoTooltip content="Indiquez le nombre total de parts disponibles pour votre projet." />
            </div>
            <Input
              id="totalShares"
              name="totalShares"
              type="number"
              value={campaignForm.totalShares}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="goal">Objectif de levée (en USDC)</Label>
              <InfoTooltip content="Définissez le montant total que vous souhaitez lever pour votre projet." />
            </div>
            <Input
              id="goal"
              name="goal"
              type="number"
              value={campaignForm.goal}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <InfoTooltip content="Choisissez la date de clôture de votre campagne." />
            </div>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={campaignForm.endDate}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          {campaignForm.hasLawyer && (
            <>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerName">Nom de l'avocat</Label>
                  <InfoTooltip content="Entrez le nom complet de l'avocat associé à votre campagne." />
                </div>
                <Input
                  id="lawyerName"
                  name="name"
                  value={campaignForm.lawyer.name}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerContact">Contact de l'avocat</Label>
                  <InfoTooltip content="Fournissez une adresse e-mail ou un numéro de téléphone pour contacter l'avocat." />
                </div>
                <Input
                  id="lawyerContact"
                  name="contact"
                  value={campaignForm.lawyer.contact}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerPhone">Téléphone de l'avocat</Label>
                  <InfoTooltip content="Indiquez le numéro de téléphone professionnel de l'avocat." />
                </div>
                <Input
                  id="lawyerPhone"
                  name="phone"
                  value={campaignForm.lawyer.phone}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="remunerationType">Type de rémunération</Label>
              <InfoTooltip content="Spécifiez comment les investisseurs seront rémunérés (ex: dividendes, plus-value, etc.)." />
            </div>
            <Input
              id="remunerationType"
              name="remunerationType"
              value={campaignForm.investmentTerms.remunerationType}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="roi">Temps de retour sur investissement estimé</Label>
              <InfoTooltip content="Indiquez le délai estimé pour que les investisseurs récupèrent leur mise initiale." />
            </div>
            <Input
              id="roi"
              name="roi"
              value={campaignForm.investmentTerms.roi}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="nativeTokenDistribution"
              checked={campaignForm.investmentTerms.nativeTokenDistribution}
              onCheckedChange={() => handleCheckboxChange('nativeTokenDistribution', 'investmentTerms')}
            />
            <Label htmlFor="nativeTokenDistribution">Distribution de tokens native</Label>
            <InfoTooltip content="Cochez cette case si vous prévoyez de distribuer des tokens natifs à vos investisseurs." />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="percentageMinted">Pourcentage de la société minté</Label>
              <InfoTooltip content="Indiquez le pourcentage de la société qui sera représenté par les tokens émis." />
            </div>
            <Input
              id="percentageMinted"
              name="percentageMinted"
              type="number"
              value={campaignForm.companyShares.percentageMinted}
              onChange={(e) => handleNestedInputChange(e, 'companyShares')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="vertePortalLink">Lien vers le portail Verte</Label>
              <InfoTooltip content="Fournissez le lien vers votre page sur le portail Verte." />
            </div>
            <Input
              id="vertePortalLink"
              name="vertePortalLink"
              value={campaignForm.companyShares.vertePortalLink}
              onChange={(e) => handleNestedInputChange(e, 'companyShares')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label>Équipe</Label>
              <InfoTooltip content="Ajoutez les membres clés de votre équipe et leurs rôles." />
            </div>
            {campaignForm.teamMembers.map((member, index) => (
              <div key={index} className="mt-2 space-y-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Input
                  placeholder="Nom"
                  value={member.name}
                  onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                  className="bg-white dark:bg-gray-700"
                />
                <Input
                  placeholder="Rôle"
                  value={member.role}
                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                  className="bg-white dark:bg-gray-700"
                />
                <Input
                  placeholder="Twitter"
                  value={member.twitter}
                  onChange={(e) => handleTeamMemberChange(index, 'twitter', e.target.value)}
                  className="bg-white dark:bg-gray-700"
                />
                <Input
                  placeholder="Facebook"
                  value={member.facebook}
                  onChange={(e) => handleTeamMemberChange(index, 'facebook', e.target.value)}
                  className="bg-white dark:bg-gray-700"
                />
                <Button
                  type="button"
                  onClick={() => removeTeamMember(index)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Supprimer ce membre
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addTeamMember}
              className="mt-2 bg-lime-500 hover:bg-lime-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="documents">Documents de la campagne</Label>
              <InfoTooltip content="Téléchargez les documents pertinents pour votre campagne (business plan, pitch deck, etc.)." />
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="documents"
                name="documents"
                type="file"
                onChange={(e) => handleFileChange(e, 'documents')}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('documents').click()}
                className="bg-lime-500 hover:bg-lime-600 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
              <span className="text-sm text-gray-400">
                {campaignForm.documents.length} fichier(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.documents.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-100 dark:bg-gray-800">
                {campaignForm.documents.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index, 'documents')}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="media">Médias de la campagne</Label>
              <InfoTooltip content="Ajoutez des vidéos ou autres médias pour présenter votre projet." />
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="media"
                name="media"
                type="file"
                onChange={(e) => handleFileChange(e, 'media')}
                multiple
                accept="video/*"
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('media').click()}
                className="bg-lime-500 hover:bg-lime-600 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ajouter des médias
              </Button>
              <span className="text-sm text-gray-400">
                {campaignForm.media.length} média(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.media.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-100 dark:bg-gray-800">
                {campaignForm.media.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index, 'media')}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={campaignForm.acceptTerms}
              onCheckedChange={() => handleCheckboxChange('acceptTerms')}
              required
            />
            <Label htmlFor="acceptTerms">
              J'accepte les conditions générales d'utilisation et je décharge l'application de toute responsabilité
            </Label>
            <InfoTooltip content="En cochant cette case, vous acceptez nos conditions d'utilisation et notre politique de confidentialité." />
          </div>

          <Button type="submit" className="w-full bg-lime-600 hover:bg-lime-700 text-white" disabled={!campaignForm.acceptTerms}>
            Créer la campagne
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}