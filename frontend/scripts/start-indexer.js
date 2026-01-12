/**
 * SCRIPT DE LANCEMENT DE L'INDEXEUR - LIVAR
 * 
 * Ce script permet de maintenir Supabase à jour par rapport à la Blockchain.
 * Usage: cd frontend && node scripts/start-indexer.js
 */

import 'dotenv/config';
import indexer from '../lib/services/blockchain-indexer.js';

console.log('--- LIVAR BLOCKCHAIN INDEXER ---');
console.log('Initialisation du service...');

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
