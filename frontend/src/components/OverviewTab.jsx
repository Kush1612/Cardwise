const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const buildConicGradient = (segments, colors) => {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  if (!total) return 'conic-gradient(#e2e8f0 0deg 360deg)';

  let cursor = 0;
  const parts = segments.map((item, index) => {
    const angle = (item.value / total) * 360;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(', ')})`;
};

const DonutChartCard = ({ title, subtitle, data, valueFormatter = (v) => v }) => {
  const colors = ['#0f766e', '#d97706', '#2563eb', '#9333ea', '#db2777', '#16a34a'];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const gradient = buildConicGradient(data, colors);

  return (
    <div className="glass-surface rounded-2xl p-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <div className="h-28 w-28 rounded-full" style={{ backgroundImage: gradient }} />
          <div className="absolute inset-4 grid place-items-center rounded-full bg-white/85 backdrop-blur">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-sm font-bold text-slate-900">{valueFormatter(total)}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          {data.length === 0 && <p className="text-slate-500">No data yet</p>}
          {data.slice(0, 5).map((item, index) => (
            <div key={item.label} className="flex items-center gap-2 text-slate-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="max-w-32 truncate">{item.label}</span>
              <span className="font-semibold">{valueFormatter(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, hint }) => (
  <div className="glass-surface rounded-2xl p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </div>
);

const OverviewTab = ({ cards, analytics, monthly }) => {
  const totalCards = cards.length;
  const lifetimeSavings = analytics.reduce((sum, item) => sum + Number(item.totalSavings || 0), 0);
  const monthlySavings = Number(monthly?.totalSavings || 0);
  const monthlyTransactions = Number(monthly?.transactionCount || 0);
  const avgSavingsPerTxn = monthlyTransactions ? monthlySavings / monthlyTransactions : 0;

  const usageByCard = analytics.map((item) => ({ label: item.cardName || 'Unknown', value: Number(item.uses || 0) }));
  const savingsByCard = analytics.map((item) => ({
    label: item.cardName || 'Unknown',
    value: Number(item.totalSavings || 0),
  }));

  const rewardTypeMap = cards.reduce((acc, card) => {
    acc[card.rewardType] = (acc[card.rewardType] || 0) + 1;
    return acc;
  }, {});
  const rewardTypeData = Object.entries(rewardTypeMap).map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cards Added" value={totalCards} hint="Active cards in your wallet" />
        <StatCard
          label="Monthly Savings"
          value={formatCurrency(monthlySavings)}
          hint={`${monthlyTransactions} tracked transactions`}
        />
        <StatCard
          label="Avg Saving / Txn"
          value={formatCurrency(avgSavingsPerTxn)}
          hint="Efficiency of card recommendations"
        />
        <StatCard label="Lifetime Savings" value={formatCurrency(lifetimeSavings)} hint="Based on usage analytics" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DonutChartCard
          title="Usage Distribution"
          subtitle="How often each card is picked"
          data={usageByCard}
          valueFormatter={(v) => v}
        />
        <DonutChartCard
          title="Savings Distribution"
          subtitle="Which cards drive most savings"
          data={savingsByCard}
          valueFormatter={(v) => formatCurrency(v)}
        />
        <DonutChartCard
          title="Reward Type Mix"
          subtitle="Cashback vs points vs miles"
          data={rewardTypeData}
          valueFormatter={(v) => v}
        />
      </div>

      <div className="glass-surface rounded-2xl p-4">
        <p className="text-sm font-semibold text-slate-800">Top Performing Cards</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/55 bg-white/45 p-2">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Card</th>
                <th className="py-2 pr-4 font-medium">Uses</th>
                <th className="py-2 pr-4 font-medium">Total Savings</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {analytics.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={3}>
                    No usage history yet. Run recommendations to generate insights.
                  </td>
                </tr>
              )}
              {analytics.slice(0, 6).map((item) => (
                <tr key={item.cardId} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-medium">{item.cardName}</td>
                  <td className="py-3 pr-4">{item.uses}</td>
                  <td className="py-3 pr-4">{formatCurrency(item.totalSavings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
