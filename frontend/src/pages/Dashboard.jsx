import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CardForm from '../components/CardForm';
import CardList from '../components/CardList';
import RecommendationForm from '../components/RecommendationForm';
import RecommendationResult from '../components/RecommendationResult';
import OverviewTab from '../components/OverviewTab';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [cards, setCards] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      const [cardsData, monthlyData, analyticsData] = await Promise.all([
        api.getCards(token),
        api.monthlySavings(token),
        api.analytics(token),
      ]);
      setCards(cardsData);
      setMonthly(monthlyData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    } else {
      setLoadingData(false);
    }
  }, []);

  const handleRecommendationResult = (result) => {
    setRecommendation(result);
    fetchDashboardData();
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'cards', label: 'Cards' },
    { id: 'recommend', label: 'Recommend' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden p-4 md:p-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-8 h-[28rem] w-[28rem] rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="glass-surface-strong overflow-hidden rounded-[2rem]">
          <div className="bg-gradient-to-r from-sky-600/95 via-blue-600/95 to-indigo-600/95 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-50/90">CardWise Intelligence</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl">Welcome back, {user?.name}</h1>
                <p className="text-sm text-cyan-100">Track cards, optimize transactions, and maximize savings.</p>
              </div>
              <button onClick={logout} className="glass-button bg-white/20 text-white hover:bg-white/30">
                Logout
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/40 bg-white/45 p-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`glass-tab ${activeTab === tab.id ? 'glass-tab-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {loadingData ? (
          <div className="glass-surface rounded-2xl p-6 text-sm text-slate-600">
            Loading dashboard...
          </div>
        ) : null}

        {!loadingData && activeTab === 'overview' && (
          <OverviewTab cards={cards} analytics={analytics} monthly={monthly} />
        )}

        {!loadingData && activeTab === 'cards' && (
          <div className="grid gap-5 xl:grid-cols-2">
            <CardForm onCardAdded={fetchDashboardData} />
            <CardList cards={cards} onCardDeleted={fetchDashboardData} />
          </div>
        )}

        {!loadingData && activeTab === 'recommend' && (
          <div className="grid gap-5 xl:grid-cols-2">
            <RecommendationForm onResult={handleRecommendationResult} />
            <RecommendationResult result={recommendation} />
          </div>
        )}

        <section className="glass-surface rounded-2xl p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Pro Tip</p>
            <p className="mt-1 text-sm text-slate-600">
              Keep at least one high-reward card per category (dining/travel/shopping) and refresh card benefits
              monthly to keep recommendations accurate.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
