import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Link, X } from 'lucide-react';

const ModalArticle = ({ article, isOpen, onClose }) => {
  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-lime-600 dark:text-lime-400">
            {article.titre}
          </DialogTitle>
          <DialogDescription>
            {article.description || `Publié le ${new Date(article.dateCreation).toLocaleDateString()}`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {article.image && (
            <img 
              src={article.image} 
              alt={article.titre} 
              className="w-full h-64 object-cover rounded-md"
            />
          )}
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">{article.contenu}</p>
          </div>

          {article.lien && (
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={article.lien} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Link className="mr-2 h-4 w-4" />
                  Source externe
                </a>
              </Button>
            </div>
          )}

          <div className="flex space-x-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => navigator.share({ 
              title: article.titre, 
              text: article.contenu, 
              url: window.location.href 
            })}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalArticle;