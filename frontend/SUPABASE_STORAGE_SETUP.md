# Configuration Supabase Storage pour Documents de Campagne

## 📦 Bucket Configuration

### Étape 1: Créer le bucket `campaign-documents`

Allez sur votre dashboard Supabase: https://app.supabase.com

#### Option A: Via l'interface
1. Allez dans **Storage** → **New Bucket**
2. Nom du bucket: `campaign-documents`
3. **Public bucket**: ✅ Activé (pour URLs publiques)
4. Cliquez sur **Create bucket**

#### Option B: Via SQL Editor
Exécutez ce SQL dans l'éditeur SQL de Supabase:

```sql
-- Créer le bucket public
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-documents', 'campaign-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Politique: Autoriser les uploads publics
CREATE POLICY IF NOT EXISTS "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-documents');

-- Politique: Autoriser les lectures publiques
CREATE POLICY IF NOT EXISTS "Allow public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-documents');

-- Politique: Autoriser la suppression pour les créateurs
CREATE POLICY IF NOT EXISTS "Allow creators to delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-documents');
```

### Étape 2: Variables d'environnement

Assurez-vous que votre fichier `.env.local` contient:

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_KEY=votre_service_key  # Optionnel, pour bypass RLS
```

### Étape 3: Structure des fichiers

Les fichiers seront organisés ainsi:

```
campaign-documents/
├── campaigns/
│   ├── {campaign_address}/
│   │   ├── whitepaper/
│   │   │   └── {timestamp}_{filename}
│   │   ├── pitchDeck/
│   │   │   └── {timestamp}_{filename}
│   │   ├── legalDocuments/
│   │   │   └── {timestamp}_{filename}
│   │   └── media/
│   │       └── {timestamp}_{filename}
```

## 🗜️ Compression

### Images
- Redimensionnées à max 1920px de largeur
- Compression qualité 85%
- Conversion automatique en WebP si non-standard
- Cible: < 500KB par image

### PDFs
- Limite: 2MB par fichier
- Pas de compression automatique (nécessite lib externe)
- Vérification de taille avant upload

## 📊 Limites de stockage

**Quota gratuit Supabase**: 1GB
**Votre quota**: 0.25GB (250MB)

### Estimation par campagne:
- Whitepaper (PDF): ~500KB - 2MB
- Pitch Deck (PDF): ~1MB - 2MB
- Documents légaux: ~500KB - 1MB
- Media (images): ~200KB - 500KB chacune

**Total moyen par campagne**: 3-6MB

**Nombre de campagnes supportées avec 250MB**: ~40-80 campagnes

## 🔧 Migration depuis l'ancien système

Si vous avez des documents existants dans `/public/uploads/`:

```bash
# Script à exécuter pour migrer (TODO)
node scripts/migrate-to-supabase.js
```

## ✅ Test

Pour tester l'upload:

1. Lancez le frontend: `npm run dev`
2. Créez une campagne test
3. Uploadez un document
4. Vérifiez dans Supabase Storage → campaign-documents
5. Vérifiez dans la table `campaign_documents`

## 🐛 Troubleshooting

### Erreur 403 "Row Level Security"
→ Vérifiez que les policies sont bien créées (voir SQL ci-dessus)

### Erreur "Bucket not found"
→ Créez le bucket via l'interface ou SQL

### Fichiers trop gros
→ Les images sont compressées automatiquement
→ PDFs > 2MB seront rejetés avec erreur

### URL publiques ne fonctionnent pas
→ Vérifiez que le bucket est bien **public**
→ Settings → Storage → Votre bucket → "Public" doit être ✅
