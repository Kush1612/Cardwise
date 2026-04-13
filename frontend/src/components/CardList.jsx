import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CardList = ({ cards, onCardDeleted }) => {
  const { token } = useAuth();
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async (cardId) => {
    const confirmed = window.confirm('Delete this card?');
    if (!confirmed) return;

    setError('');
    setDeletingId(cardId);

    try {
      await api.deleteCard(token, cardId);
      onCardDeleted();
    } catch (err) {
      setError(err.message || 'Failed to delete card');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="glass-surface rounded-2xl p-5">
      <h2 className="font-display text-xl text-primary">Saved Cards</h2>
      <div className="mt-4 space-y-3">
        {cards.length === 0 && <p className="text-sm text-slate-500">No cards added yet.</p>}
        {cards.map((card) => (
          <div key={card._id} className="rounded-xl border border-white/55 bg-white/45 p-3 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{card.cardName} ({card.bankName})</p>
                <p className="text-sm text-slate-600">
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase">{card.rewardType}</span>
                  <span className="ml-2">Last4: **** {card.last4Digits}</span>
                </p>
                <p className="text-sm text-slate-600">Annual fee: ₹{card.annualFee}</p>
                <p className="text-sm text-slate-600">Rates: {card.rewardRates.map((r) => `${r.category} ${r.rate}%`).join(', ')}</p>
              </div>
              <button
                onClick={() => handleDelete(card._id)}
                disabled={deletingId === card._id}
                className="glass-button border-red-300/80 px-3 py-1 text-red-700 hover:bg-red-50/70 disabled:opacity-60"
              >
                {deletingId === card._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CardList;
