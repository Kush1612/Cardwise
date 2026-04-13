const mongoose = require('mongoose');

const rewardRateSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['fuel', 'dining', 'travel', 'shopping', 'grocery', 'entertainment', 'other'],
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    merchant: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['fuel', 'dining', 'travel', 'shopping', 'grocery', 'entertainment', 'other', 'all'],
      default: 'all',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cardName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    rewardType: {
      type: String,
      required: true,
      enum: ['cashback', 'points', 'miles'],
    },
    rewardRates: {
      type: [rewardRateSchema],
      default: [],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: 'At least one reward rate is required',
      },
    },
    annualFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    last4Digits: {
      type: String,
      required: true,
      match: /^\d{4}$/,
    },
    offers: {
      type: [offerSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
