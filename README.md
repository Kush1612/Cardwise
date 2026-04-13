# CardWise

CardWise is a full-stack fintech web app that recommends the best credit card for every transaction using a hybrid engine:
1. deterministic reward math in code
2. GPT-based explanation and alternatives

## Tech Stack
- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- AI: Google Gemini API

## Folder Structure
```
cardwise/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
  frontend/
    src/
      api/
      components/
      context/
      pages/
```

## Setup
1. Copy env files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
2. Install dependencies:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. Start backend:
   - `cd backend && npm run dev`
4. Start frontend:
   - `cd frontend && npm run dev`

## API Endpoints
- `POST /auth/signup`
- `POST /auth/login`
- `GET /cards/catalog` (bank + card dropdown data)
- `GET /cards`
- `POST /cards`
- `POST /recommend`
- `GET /recommend/monthly-savings` (bonus)
- `GET /recommend/analytics` (bonus)

## Security Notes
- Full card numbers are explicitly rejected in card creation.
- Only `last4Digits` is stored.
- Passwords are bcrypt hashed.
- JWT auth protects card/recommendation routes.

## Recommendation Engine
1. Base rewards are calculated from card category rates.
2. Offers are matched by merchant/category and added.
3. Best card is selected by computed value.
4. Structured data is sent to Gemini for:
   - explanation (`reason`)
   - estimated reward phrasing
   - alternatives

## Offer Auto-Fetch
- When adding a card, CardWise can auto-discover offers and reward rates from web pages using AI extraction.
- Client sends `autoFetchOffers: true` in `POST /cards`.
- Backend enriches the saved card's `offers` and `rewardRates` automatically when extraction succeeds.

System prompt used:
"You are a financial assistant that recommends the best credit card for a given transaction. You analyze user cards, categories, cashback rates, and offers. Always return:
1. Best card
2. Reason
3. Estimated reward
4. Alternative options"
# Cardwise
# CardwiseFin
# CardwiseFin
# CardwiseFin
# CardwiseFin
# CardwiseFin
