const StatsPanel = ({ monthly, analytics }) => {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="font-display text-xl text-primary">Savings Insights</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-primary/5 p-4">
          <p className="text-sm text-slate-500">Current Month Savings</p>
          <p className="text-2xl font-bold text-primary">₹{monthly?.totalSavings || 0}</p>
          <p className="text-sm text-slate-600">Transactions: {monthly?.transactionCount || 0}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm text-slate-500">Top Performing Cards</p>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {analytics.length === 0 && <p>No usage history yet.</p>}
            {analytics.slice(0, 3).map((item) => (
              <p key={item.cardId}>{item.cardName}: ₹{item.totalSavings} ({item.uses} uses)</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
