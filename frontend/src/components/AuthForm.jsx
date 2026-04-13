import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const AuthForm = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = mode === 'signup' ? form : { email: form.email, password: form.password };
      const data = mode === 'signup' ? await api.signup(payload) : await api.login(payload);
      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-surface-strong mx-auto w-full max-w-md rounded-3xl p-8">
      <h1 className="font-display text-3xl text-primary">CardWise</h1>
      <p className="mt-2 text-sm text-slate-600">Choose the best card for every transaction.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {mode === 'signup' && (
          <input
            required
            placeholder="Name"
            className="glass-input px-4 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          required
          type="email"
          placeholder="Email"
          className="glass-input px-4 py-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          minLength={6}
          type="password"
          placeholder="Password"
          className="glass-input px-4 py-2"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="glass-button-primary w-full py-2 disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Login'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        className="mt-4 text-sm text-sky-700 underline"
      >
        {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign up'}
      </button>
    </div>
  );
};

export default AuthForm;
