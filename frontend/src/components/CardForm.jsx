import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const OTHER_OPTION = '__other__';

const createDefaultForm = () => ({
  cardName: '',
  bankName: '',
  rewardType: 'cashback',
  annualFee: 0,
  last4Digits: '',
  rewardRates: [],
  notes: ''
});

const CardForm = ({ onCardAdded }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchInfo, setFetchInfo] = useState(null);
  const [catalog, setCatalog] = useState({ banks: [], cardsByBank: {}, catalog: [] });
  const [form, setForm] = useState(createDefaultForm());
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCard, setSelectedCard] = useState('');

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await api.getCardCatalog();
        setCatalog(data);
      } catch (catalogError) {
        console.error(catalogError.message);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, []);

  const cardOptions = useMemo(() => {
    if (!selectedBank || selectedBank === OTHER_OPTION) return [];
    return catalog.cardsByBank[selectedBank] || [];
  }, [selectedBank, catalog]);

  const onBankChange = (value) => {
    setSelectedBank(value);
    setSelectedCard('');

    if (value === OTHER_OPTION) {
      setForm({ ...form, bankName: '', cardName: '' });
      return;
    }

    setForm({ ...form, bankName: value, cardName: '' });
  };

  const onCardChange = (value) => {
    setSelectedCard(value);

    if (value === OTHER_OPTION) {
      setForm({ ...form, cardName: '' });
      return;
    }

    const selected = cardOptions.find((item) => item.cardName === value);
    setForm({
      ...form,
      cardName: value,
      rewardType: selected?.rewardType || form.rewardType
    });
  };

  const addCard = async (event) => {
    event.preventDefault();
    setError('');
    setFetchInfo(null);
    setLoading(true);

    try {
      const payload = {
        ...form,
        annualFee: Number(form.annualFee),
        rewardRates: form.rewardRates.map((r) => ({ ...r, rate: Number(r.rate) })),
        autoFetchOffers: true
      };

      const response = await api.addCard(token, payload);
      setFetchInfo(response.offerFetch || null);
      setForm(createDefaultForm());
      setSelectedBank('');
      setSelectedCard('');
      onCardAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={addCard} className="glass-surface rounded-2xl p-5 space-y-4">
      <h2 className="font-display text-xl text-primary">Add Credit Card</h2>
      <p className="text-sm text-slate-500">Pick your bank/card and CardWise will fetch rates + offers automatically.</p>

      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800 backdrop-blur">
        Offers and reward rates are auto-fetched from the web using AI for the selected card.
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          required
          className="glass-input"
          value={selectedBank}
          onChange={(e) => onBankChange(e.target.value)}
        >
          <option value="">Select bank</option>
          {catalog.banks.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
          <option value={OTHER_OPTION}>Other (type manually)</option>
        </select>

        {selectedBank === OTHER_OPTION ? (
          <input
            required
            placeholder="Bank name"
            className="glass-input"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />
        ) : (
          <select
            required
            className="glass-input"
            value={selectedCard}
            onChange={(e) => onCardChange(e.target.value)}
            disabled={!selectedBank || selectedBank === OTHER_OPTION || catalogLoading}
          >
            <option value="">Select card</option>
            {cardOptions.map((item) => (
              <option key={item.cardName} value={item.cardName}>
                {item.cardName}
              </option>
            ))}
            <option value={OTHER_OPTION}>Other (type manually)</option>
          </select>
        )}

        {(selectedCard === OTHER_OPTION || selectedBank === OTHER_OPTION) && (
          <input
            required
            placeholder="Card name"
            className="glass-input"
            value={form.cardName}
            onChange={(e) => setForm({ ...form, cardName: e.target.value })}
          />
        )}

        <select
          className="glass-input"
          value={form.rewardType}
          onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
        >
          <option value="cashback">Cashback</option>
          <option value="points">Points</option>
          <option value="miles">Miles</option>
        </select>

        <input
          required
          pattern="[0-9]{4}"
          placeholder="Last 4 digits"
          className="glass-input"
          value={form.last4Digits}
          onChange={(e) => setForm({ ...form, last4Digits: e.target.value })}
        />

        <input
          type="number"
          min="0"
          placeholder="Annual fee"
          className="glass-input"
          value={form.annualFee}
          onChange={(e) => setForm({ ...form, annualFee: e.target.value })}
        />
      </div>

      <textarea
        className="glass-input min-h-[92px] w-full"
        placeholder="Special notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      {fetchInfo && (
        <p className="text-sm text-emerald-700">
          {fetchInfo.message} Fetched offers: {fetchInfo.fetchedCount}. Reward rates: {fetchInfo.rewardRateCount}.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button disabled={loading} className="glass-button-primary disabled:opacity-50">
        {loading ? 'Saving and fetching offers...' : 'Save Card'}
      </button>
    </form>
  );
};

export default CardForm;
