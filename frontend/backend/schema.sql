-- =============================================================================
-- SCHÉMA POSTGRESQL - LIVAR
-- =============================================================================
-- Exécuter ce script pour créer les tables dans PostgreSQL
-- =============================================================================

-- Table des campagnes
CREATE TABLE IF NOT EXISTS campaigns (
    address VARCHAR(42) PRIMARY KEY,
    creator VARCHAR(42),
    name VARCHAR(255),
    symbol VARCHAR(50),
    goal DECIMAL(78, 0),
    raised DECIMAL(78, 0) DEFAULT 0,
    share_price DECIMAL(78, 0),
    shares_sold INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    is_finalized BOOLEAN DEFAULT false,
    end_date TIMESTAMP,
    metadata_uri TEXT,
    category VARCHAR(100),
    logo TEXT,
    current_round INTEGER DEFAULT 0,
    nft_background_color VARCHAR(20),
    nft_text_color VARCHAR(20),
    nft_logo_url TEXT,
    nft_sector VARCHAR(100),
    total_investors INTEGER DEFAULT 0,
    unique_investors INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    last_synced_block BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);

-- Table des transactions
CREATE TABLE IF NOT EXISTS campaign_transactions (
    tx_hash VARCHAR(66) PRIMARY KEY,
    campaign_address VARCHAR(42) NOT NULL,
    investor VARCHAR(42),
    amount DECIMAL(78, 0),
    shares INTEGER,
    round_number INTEGER,
    type VARCHAR(50) DEFAULT 'purchase',
    block_number BIGINT,
    timestamp TIMESTAMP,
    commission DECIMAL(78, 0),
    net_amount DECIMAL(78, 0),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (campaign_address) REFERENCES campaigns(address) ON DELETE CASCADE
);

-- Index pour les transactions
CREATE INDEX IF NOT EXISTS idx_transactions_campaign ON campaign_transactions(campaign_address);
CREATE INDEX IF NOT EXISTS idx_transactions_investor ON campaign_transactions(investor);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON campaign_transactions(timestamp);

-- Table des promotions
CREATE TABLE IF NOT EXISTS campaign_promotions (
    id SERIAL PRIMARY KEY,
    campaign_address VARCHAR(42) NOT NULL,
    creator VARCHAR(42),
    boost_type VARCHAR(50) NOT NULL,
    round_number INTEGER DEFAULT 0,
    eth_amount DECIMAL(78, 0),
    start_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    expired_at TIMESTAMP,
    tx_hash VARCHAR(66),
    block_number BIGINT,
    network VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (campaign_address) REFERENCES campaigns(address) ON DELETE CASCADE
);

-- Index pour les promotions
CREATE INDEX IF NOT EXISTS idx_promotions_campaign ON campaign_promotions(campaign_address);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON campaign_promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_boost_type ON campaign_promotions(boost_type);
CREATE INDEX IF NOT EXISTS idx_promotions_end ON campaign_promotions(end_timestamp);

-- Table des documents
CREATE TABLE IF NOT EXISTS campaign_documents (
    id SERIAL PRIMARY KEY,
    campaign_address VARCHAR(42) NOT NULL,
    ipfs_hash VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    category VARCHAR(50) DEFAULT 'other',
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (campaign_address) REFERENCES campaigns(address) ON DELETE CASCADE
);

-- Index pour les documents
CREATE INDEX IF NOT EXISTS idx_documents_campaign ON campaign_documents(campaign_address);
CREATE INDEX IF NOT EXISTS idx_documents_category ON campaign_documents(category);

-- Table d'état de synchronisation
CREATE TABLE IF NOT EXISTS sync_state (
    id VARCHAR(100) PRIMARY KEY,
    last_block BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vue pour les promotions actives
CREATE OR REPLACE VIEW active_promotions AS
SELECT 
    cp.*,
    c.name as campaign_name,
    c.logo as campaign_logo,
    c.category as campaign_category
FROM campaign_promotions cp
JOIN campaigns c ON cp.campaign_address = c.address
WHERE cp.is_active = true 
AND cp.end_timestamp > NOW();

-- Fonction pour mettre à jour les statistiques d'une campagne
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campaigns SET
        total_transactions = (
            SELECT COUNT(*) FROM campaign_transactions 
            WHERE campaign_address = NEW.campaign_address
        ),
        unique_investors = (
            SELECT COUNT(DISTINCT investor) FROM campaign_transactions 
            WHERE campaign_address = NEW.campaign_address
        ),
        updated_at = NOW()
    WHERE address = NEW.campaign_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats après chaque transaction
DROP TRIGGER IF EXISTS trigger_update_campaign_stats ON campaign_transactions;
CREATE TRIGGER trigger_update_campaign_stats
AFTER INSERT ON campaign_transactions
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats();
