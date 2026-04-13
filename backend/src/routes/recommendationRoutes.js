const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  recommendCard,
  getMonthlySavings,
  getUsageAnalytics,
} = require('../controllers/recommendationController');

const router = express.Router();

router.post('/', authMiddleware, recommendCard);
router.get('/monthly-savings', authMiddleware, getMonthlySavings);
router.get('/analytics', authMiddleware, getUsageAnalytics);

module.exports = router;
