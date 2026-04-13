const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { getRecommendation } = require('../services/recommendationService');
const { detectCategoryFromMerchant } = require('../utils/categoryUtils');
const { detectCategoryWithAI } = require('../services/aiService');

const recommendCard = async (req, res, next) => {
  try {
    const { merchant, amount, category } = req.body;

    if (!merchant || !amount) {
      return res.status(400).json({ message: 'merchant and amount are required' });
    }

    let normalizedCategory = category;
    if (!normalizedCategory) {
      const detected = detectCategoryFromMerchant(merchant);
      normalizedCategory = detected !== 'other' ? detected : (await detectCategoryWithAI(merchant)) || 'other';
    }

    const cards = await Card.find({ userId: req.user.id });

    if (!cards.length) {
      return res.status(404).json({ message: 'No cards found. Please add a card first.' });
    }

    const recommendation = await getRecommendation(
      {
        merchant,
        amount: Number(amount),
        category: normalizedCategory,
      },
      cards
    );

    if (recommendation.bestCardId) {
      await Transaction.create({
        userId: req.user.id,
        merchant,
        amount: Number(amount),
        category: normalizedCategory,
        selectedCardId: recommendation.bestCardId,
        estimatedSavings: recommendation.estimatedSavingsValue,
      });
    }

    return res.json({
      transaction: {
        merchant,
        amount: Number(amount),
        category: normalizedCategory,
      },
      ...recommendation,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlySavings = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const data = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$estimatedSavings' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const summary = data[0] || { totalSavings: 0, transactionCount: 0 };

    res.json({
      month: now.toISOString().slice(0, 7),
      totalSavings: Number(summary.totalSavings.toFixed(2)),
      transactionCount: summary.transactionCount,
    });
  } catch (error) {
    next(error);
  }
};

const getUsageAnalytics = async (req, res, next) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const analytics = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$selectedCardId',
          uses: { $sum: 1 },
          totalSavings: { $sum: '$estimatedSavings' },
        },
      },
      { $sort: { totalSavings: -1 } },
      {
        $lookup: {
          from: 'cards',
          localField: '_id',
          foreignField: '_id',
          as: 'card',
        },
      },
      {
        $project: {
          _id: 0,
          cardId: '$_id',
          uses: 1,
          totalSavings: { $round: ['$totalSavings', 2] },
          cardName: { $arrayElemAt: ['$card.cardName', 0] },
          bankName: { $arrayElemAt: ['$card.bankName', 0] },
        },
      },
    ]);

    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recommendCard,
  getMonthlySavings,
  getUsageAnalytics,
};
