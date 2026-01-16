/**
 * SCRIPT DE LANCEMENT DE L'INDEXEUR - LIVAR
 * 
 * Ce script permet de maintenir Supabase à jour par rapport à la Blockchain.
 * Usage: cd frontend && node scripts/start-indexer.js
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

console.log('DEBUG NETWORK:', process.env.NEXT_PUBLIC_NETWORK);

console.log('--- LIVAR BLOCKCHAIN INDEXER ---');
console.log('Initialisation du service...');

// Import dynamique pour garantir que dotenv est chargé AVANT config.js
const { default: indexer } = await import('../lib/services/blockchain-indexer.js');

// Démarrage de l'indexeur
indexer.start()
    .then(() => {
        console.log('Indexeur démarré avec succès.');
        console.log('Appuyez sur Ctrl+C pour arrêter.');
    })
    .catch(err => {
        console.error('Erreur lors du démarrage de l\'indexeur:', err);
        process.exit(1);
    });

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\nArrêt du service...');
    process.exit(0);
});
