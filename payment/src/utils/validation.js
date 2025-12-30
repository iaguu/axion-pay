export function buildCardSummary(card) {
  if (!card) return null;
  return {
    last4: card.number ? card.number.slice(-4) : '****',
    holder: card.holder_name
  };
}

export function normalizeMetadata(metadata) {
  return metadata || {};
}