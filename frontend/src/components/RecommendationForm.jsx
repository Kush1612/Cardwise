import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const RecommendationForm = ({ onResult }) => {
  const { token } = useAuth();
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.recommend(token, {
        merchant,
        amount: Number(amount),
        ...(category ? { category } : {}),
      });
      onResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-surface space-y-4 rounded-2xl p-5">
      <h2 className="font-display text-xl text-primary">Recommend Best Card</h2>
      <p className="text-sm text-slate-500">Enter merchant + amount and CardWise will rank your saved cards.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <input required placeholder="Merchant (e.g., Swiggy)" className="glass-input" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Auto detect</option>
          {['fuel', 'dining', 'travel', 'shopping', 'grocery', 'entertainment', 'other'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input required type="number" min="1" placeholder="Amount" className="glass-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="glass-button-primary disabled:opacity-50">
        {loading ? 'Analyzing...' : 'Get Recommendation'}
      </button>
    </form>
  );
};

export default RecommendationForm;
