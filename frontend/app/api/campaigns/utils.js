const toStringValue = (value, fallback = '0') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  if (typeof value === 'object' && 'toString' in value) {
    try {
      return value.toString();
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
};

const parseBoolean = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'bigint') return value !== 0n;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
  }
  return Boolean(value);
};

const normalizeStatus = (status) => {
  if (status === null || status === undefined) return undefined;
  if (typeof status === 'string') return status.toLowerCase();
  return status;
};

export function mapCampaignRow(row) {
  if (!row) return null;

  const sharePriceRaw = row.share_price ?? row.sharePrice ?? '0';
  const goalRaw = row.goal ?? row.target ?? '0';
  const raisedRaw = row.raised ?? '0';
  const status = normalizeStatus(row.status);

  const isActiveFlag = parseBoolean(row.is_active ?? row.isActive);
  const isFinalizedFlag = parseBoolean(row.is_finalized ?? row.isFinalized);

  const sharePrice = toStringValue(sharePriceRaw);
  const goal = toStringValue(goalRaw);
  const raised = toStringValue(raisedRaw);

  return {
    id: row.address,
    address: row.address,
    name: row.name,
    symbol: row.symbol,
    creator: row.creator,
    goal,
    raised,
    sharePrice,
    share_price: sharePrice,
    status,
    isActive: isActiveFlag ?? (status === 'active'),
    isFinalized: isFinalizedFlag ?? (status === 'finalized'),
    endDate: row.end_date,
    metadataUri: row.metadata_uri,
    category: row.category,
    sector: row.category,
    logo: row.logo,
    sharesSold: toStringValue(row.shares_sold ?? row.sharesSold ?? '0'),
    totalShares: toStringValue(row.total_shares ?? row.totalShares ?? '0'),
    currentRound: row.current_round ?? 0,
    roundNumber: row.current_round ?? 0,
    lastSyncedBlock: row.last_synced_block ?? 0,
    updatedAt: row.updated_at,
  };
}
