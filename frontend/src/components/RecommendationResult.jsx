const RecommendationResult = ({ result }) => {
  if (!result) {
    return (
      <div className="glass-surface rounded-2xl p-5">
        <h2 className="font-display text-xl text-primary">Recommendation</h2>
        <p className="mt-2 text-sm text-slate-500">Submit a transaction to unlock the best card suggestion.</p>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-2xl p-5">
      <h2 className="font-display text-xl text-primary">Recommendation</h2>
      <div className="mt-3 rounded-2xl border border-white/60 bg-gradient-to-r from-white/60 to-cyan-100/65 p-4 backdrop-blur">
        <p className="text-sm text-slate-500">Best Card for this transaction</p>
        <p className="text-xl font-semibold text-primary">{result.bestCard || 'N/A'}</p>
        <p className="mt-2 text-sm text-slate-700">{result.reason}</p>
        <p className="mt-1 font-semibold text-accent">Estimated savings: {result.estimatedSavings}</p>
      </div>
      <div className="mt-4">
        <p className="font-semibold text-slate-700">Alternatives</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          {(result.alternatives || []).length === 0 && <li>No alternatives available.</li>}
          {(result.alternatives || []).map((alt, idx) => (
            <li key={idx} className="rounded-xl border border-white/55 bg-white/55 px-3 py-2 backdrop-blur">
              {typeof alt === 'string' ? alt : `${alt.cardName} (${alt.estimatedSavings})`}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="font-semibold text-slate-700">Ranked Breakdown</p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-white/55 bg-white/45 p-1">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/55 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Card</th>
                <th className="px-3 py-2 font-medium">Base</th>
                <th className="px-3 py-2 font-medium">Offer</th>
                <th className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(result.breakdown || []).slice(0, 5).map((row) => (
                <tr key={row.cardId} className="border-t border-slate-100 text-slate-700">
                  <td className="px-3 py-2">{row.cardName}</td>
                  <td className="px-3 py-2">₹{Number(row.baseRewardValue || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">₹{Number(row.offerValue || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 font-semibold">₹{Number(row.estimatedSavings || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(result.breakdown || []).length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    Breakdown not available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecommendationResult;
