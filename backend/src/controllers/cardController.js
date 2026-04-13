const Card = require('../models/Card');
const { cardCatalog } = require('../data/cardCatalog');
const { discoverCardBenefitsFromWeb } = require('../services/aiService');

const getCards = async (req, res, next) => {
  try {
    const cards = await Card.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

const addCard = async (req, res, next) => {
  try {
    const {
      cardName,
      bankName,
      rewardType,
      rewardRates,
      annualFee,
      offers,
      notes,
      last4Digits,
      cardNumber,
      autoFetchOffers,
    } = req.body;

    if (cardNumber) {
      return res.status(400).json({ message: 'Do not send full card numbers. Only last4Digits is allowed.' });
    }

    if (!cardName || !bankName || !rewardType || !last4Digits) {
      return res.status(400).json({
        message: 'cardName, bankName, rewardType, and last4Digits are required',
      });
    }

    const shouldAutoFetchOffers = autoFetchOffers !== false;

    // Normalize rewardType synonyms coming from various clients
    const VALID_REWARD_TYPES = ['cashback', 'points', 'miles'];
    let normalizedRewardType = (rewardType || '').toString().toLowerCase().trim();
    if (!VALID_REWARD_TYPES.includes(normalizedRewardType)) {
      if (['percentage', 'percent', 'cash'].includes(normalizedRewardType)) normalizedRewardType = 'cashback';
      else if (['point', 'points-earned'].includes(normalizedRewardType)) normalizedRewardType = 'points';
      else if (['mile', 'miles-earned'].includes(normalizedRewardType)) normalizedRewardType = 'miles';
      else normalizedRewardType = 'cashback';
    }
    let discoveredOffers = [];
    let discoveredRewardRates = [];
    let offerFetchMeta = {
      enabled: shouldAutoFetchOffers,
      aiUsed: false,
      fetchedCount: 0,
      rewardRateCount: 0,
      sources: [],
      message: 'Offer discovery skipped by request.',
    };

    if (shouldAutoFetchOffers) {
      const discovered = await discoverCardBenefitsFromWeb(cardName, bankName);
      discoveredOffers = discovered.offers;
      discoveredRewardRates = discovered.rewardRates;
      offerFetchMeta = {
        enabled: true,
        aiUsed: discovered.aiUsed,
        fetchedCount: discovered.offers.length,
        rewardRateCount: discovered.rewardRates.length,
        sources: discovered.sources,
        message: discovered.message,
      };
    }

    const resolvedRewardRates =
      Array.isArray(rewardRates) && rewardRates.length
        ? rewardRates
        : discoveredRewardRates.length
          ? discoveredRewardRates
          : [{ category: 'other', rate: 1 }];

    const card = await Card.create({
      userId: req.user.id,
      cardName,
      bankName,
      rewardType: normalizedRewardType,
      rewardRates: resolvedRewardRates,
      annualFee: annualFee || 0,
      offers: Array.isArray(offers) && offers.length ? offers : discoveredOffers,
      notes: notes || '',
      last4Digits,
    });

    res.status(201).json({
      ...card.toObject(),
      offerFetch: offerFetchMeta,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const card = await Card.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    return res.json({ message: 'Card deleted successfully', cardId: id });
  } catch (error) {
    next(error);
  }
};

const getCardCatalog = async (req, res, next) => {
  try {
    const banks = [...new Set(cardCatalog.map((item) => item.bankName))].sort();
    const cardsByBank = banks.reduce((acc, bankName) => {
      acc[bankName] = cardCatalog
        .filter((item) => item.bankName === bankName)
        .map((item) => ({ cardName: item.cardName, rewardType: item.rewardType }));
      return acc;
    }, {});

    res.json({
      banks,
      cardsByBank,
      catalog: cardCatalog,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCards,
  addCard,
  deleteCard,
  getCardCatalog,
};
