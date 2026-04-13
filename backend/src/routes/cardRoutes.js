const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getCards, addCard, deleteCard, getCardCatalog } = require('../controllers/cardController');

const router = express.Router();

router.get('/catalog', getCardCatalog);
router.get('/', authMiddleware, getCards);
router.post('/', authMiddleware, addCard);
router.delete('/:id', authMiddleware, deleteCard);

module.exports = router;
