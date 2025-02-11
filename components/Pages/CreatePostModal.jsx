import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/firebase';

const CreatePostModal = ({ isOpen, onClose, campaignId, campaignData, editingPost }) => {  // Ajout de editingPost ici
  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    image: null,
    lien: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setFormData({
        titre: editingPost.titre,
        contenu: editingPost.contenu,
        image: null,
        lien: editingPost.lien
      });
    }
  }, [editingPost]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, image: file }));
    }
  };
 
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      let imageUrl = editingPost?.image || null;  // Garder l'ancienne image si pas de nouvelle
      if (formData.image) {
        const imageRef = ref(storage, `${campaignData.name}/news/${formData.titre}/image_${formData.image.name}`);
        const uploadResult = await uploadBytes(imageRef, formData.image);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const postData = {
        titre: formData.titre,
        contenu: formData.contenu,
        image: imageUrl,
        lien: formData.lien,
        dateCreation: editingPost ? editingPost.dateCreation : new Date().toISOString()
      };

      const postRef = doc(db, 'campaign_fire', campaignData.name, 'news', formData.titre);
      await setDoc(postRef, postData, { merge: true });

      onClose();
      setFormData({
        titre: '',
        contenu: '',
        image: null,
        lien: ''
      });
      setPreviewImage(null);

    } catch (error) {
      console.error('Erreur création/modification post:', error);
      alert('Erreur lors de la création/modification du post: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-lime-600 dark:text-lime-400">
            Créer un nouveau post
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Partagez les actualités de votre campagne avec vos investisseurs.
          </DialogDescription>
          <Button
            className="absolute top-2 right-2 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700"
            onClick={onClose}
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Input
              placeholder="Titre"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              className="w-full"
            />
          </div>

          <div>
            <Textarea
              placeholder="Contenu"
              value={formData.contenu}
              onChange={(e) => setFormData(prev => ({ ...prev, contenu: e.target.value }))}
              className="min-h-[200px] w-full"
            />
          </div>

          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            {previewImage && (
              <div className="mt-2">
                <img src={previewImage} alt="Preview" className="max-h-40 rounded" />
              </div>
            )}
          </div>

          <div>
            <Input
              placeholder="Lien externe (source)"
              value={formData.lien}
              onChange={(e) => setFormData(prev => ({ ...prev, lien: e.target.value }))}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-neutral-200 dark:bg-neutral-700"
            >
              Annuler
            </Button>
            <Button 
              className="bg-lime-500 hover:bg-lime-600 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.titre || !formData.contenu}
            >
              {isSubmitting ? 'Publication...' : 'Publier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;