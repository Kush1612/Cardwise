const { getAIRecommendationSummary } = require('./aiService');

const rewardTypeMultiplier = {
  cashback: 1,
  points: 0.2,
  miles: 0.35,
};

const NON_TRANSACTIONAL_OFFER_KEYWORDS = [
  'welcome',
  'joining',
  'activation',
  'milestone',
  'annual fee',
  'renewal',
  'first spend',
  'voucher',
  'gift card',
  'complimentary',
  'airport lounge',
  'insurance',
];

const isLikelyTransactionalOffer = (offer) => {
  const description = String(offer.description || '').toLowerCase();
  const hasNonTxnKeyword = NON_TRANSACTIONAL_OFFER_KEYWORDS.some((keyword) => description.includes(keyword));
  if (hasNonTxnKeyword) return false;

  // Broad "flat" offers with no merchant/category are usually signup bonuses, not per-transaction discounts.
  if (offer.discountType === 'flat' && !offer.merchant && (offer.category === 'all' || !offer.category)) {
    return false;
  }

  return true;
};

const calculateBaseReward = (card, category, amount) => {
  const rateEntry = card.rewardRates.find((r) => r.category === category) || card.rewardRates.find((r) => r.category === 'other');
  const rate = rateEntry ? rateEntry.rate : 0;

  const rawReward = (amount * rate) / 100;
  const multiplier = rewardTypeMultiplier[card.rewardType] ?? 1;
  const rewardValue = rawReward * multiplier;

  return {
    rate,
    rewardValue,
  };
};

const calculateOfferSavings = (card, merchant, category, amount) => {
  const merchantLower = merchant.toLowerCase();

  const applicableOffers = (card.offers || []).filter((offer) => {
    if (!isLikelyTransactionalOffer(offer)) return false;

    const merchantMatch = !offer.merchant || merchantLower.includes(offer.merchant);
    const categoryMatch = offer.category === 'all' || offer.category === category;
    return merchantMatch && categoryMatch;
  });

  const totalOfferValue = applicableOffers.reduce((total, offer) => {
    if (offer.discountType === 'flat') {
      // Protect recommendation quality from one-time or suspiciously large flat values.
      const safeFlatValue = Math.min(offer.discountValue, amount * 0.3);
      return total + safeFlatValue;
    }

    const safePercent = Math.min(offer.discountValue, 30);
    return total + (amount * safePercent) / 100;
  }, 0);

  const cappedTotalOfferValue = Math.min(totalOfferValue, amount * 0.6);

  return {
    applicableOffers,
    totalOfferValue: cappedTotalOfferValue,
  };
};

const evaluateCards = (cards, transaction) => {
  const { merchant, category, amount } = transaction;

  return cards.map((card) => {
    const baseReward = calculateBaseReward(card, category, amount);
    const offer = calculateOfferSavings(card, merchant, category, amount);
    const totalSavings = Number((baseReward.rewardValue + offer.totalOfferValue).toFixed(2));

    return {
      cardId: card._id.toString(),
      cardName: card.cardName,
      bankName: card.bankName,
      rewardType: card.rewardType,
      matchedRate: baseReward.rate,
      baseRewardValue: Number(baseReward.rewardValue.toFixed(2)),
      offerValue: Number(offer.totalOfferValue.toFixed(2)),
      estimatedSavings: totalSavings,
      offerDescriptions: offer.applicableOffers.map((o) => o.description || `${o.discountValue}${o.discountType === 'flat' ? '' : '%'} offer`),
      last4Digits: card.last4Digits,
    };
  });
};

const getRecommendation = async (transaction, cards) => {
  const evaluations = evaluateCards(cards, transaction).sort((a, b) => b.estimatedSavings - a.estimatedSavings);

  if (!evaluations.length) {
    return {
      bestCard: null,
      reason: 'No cards available for recommendation',
      estimatedSavings: 0,
      alternatives: [],
      breakdown: [],
      aiUsed: false,
    };
  }

  const best = evaluations[0];
  const fallbackReasonParts = [
    `${best.matchedRate}% ${best.rewardType} value in ${transaction.category}`,
  ];

  if (best.offerValue > 0) {
    fallbackReasonParts.push(`extra offer value ${best.offerValue.toFixed(2)}`);
  }

  const ai = await getAIRecommendationSummary({
    transaction,
    rankedCards: evaluations,
    bestCard: best,
  });

  return {
    bestCard: best.cardName,
    bestCardId: best.cardId,
    reason: ai.reason || fallbackReasonParts.join(' + '),
    estimatedSavings: `₹${best.estimatedSavings.toFixed(2)}`,
    estimatedSavingsValue: best.estimatedSavings,
    alternatives: (ai.alternatives.length ? ai.alternatives : evaluations.slice(1, 4)).map((item) => {
      if (typeof item === 'string') return item;
      return {
        cardName: item.cardName,
        estimatedSavings: `₹${Number(item.estimatedSavings || 0).toFixed(2)}`,
      };
    }),
    breakdown: evaluations,
    aiUsed: ai.aiUsed,
  };
};

module.exports = {
  getRecommendation,
};
