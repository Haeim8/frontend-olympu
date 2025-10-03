# PLAN DE TRADUCTION - CertifyCampaignDialog.jsx

## Lignes à modifier :

### 1. certificationOptions array (lignes 49-102)
- name: 'Certification Basique' → name: t('certify.basic.name')
- duration: '3-5 jours ouvrés' → duration: t('certify.basic.duration')
- lawyer: 'Avocat Junior Certifié' → lawyer: t('certify.basic.lawyer')
- features: [...] → features: [t('certify.basic.feature1'), ...] (x4)
- Même chose pour premium et enterprise

### 2. urgencyLevels (lignes 104-108)
- label: 'Standard' → label: t('certify.urgency.standard')
- label: 'Urgent (24h)' → label: t('certify.urgency.urgent')
- label: 'Express (12h)' → label: t('certify.urgency.express')

### 3. Messages d'alerte (lignes 165, 169)
- alert message → t('certify.successMessage', { lawyer, duration })
- error message → t('certify.errorMessage')

### 4. UI Labels et titres (lignes 205+)
- 'Certification Légale de votre Campagne' → t('certify.dialog.title')
- 'Pourquoi certifier...' → t('certify.whyTitle')
- Description → t('certify.whyDescription')
- Etc.

## APPROCHE:
Au lieu de modifier ligne par ligne, je vais créer une VERSION FONCTIONNELLE qui utilise les traductions,
en transformant les arrays en fonctions qui prennent `t` en paramètre.
