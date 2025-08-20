import { useState } from "react";

export default function CreditCheckCalculator() {
  const [limit, setLimit] = useState(0);
  const [balance, setBalance] = useState(0);

  const utilisation = limit > 0 ? Math.round((balance / limit) * 100) : 0;
  const status = utilisation < 30 ? "Excellent" : utilisation < 50 ? "Fair" : "Needs attention";

  return (
    <div className="glass-card glass-morph rounded-2xl p-4 sm:p-6">
      <h3 className="font-semibold mb-2">Credit utilisation calculator</h3>
      <div className="space-y-3">
        <label className="block text-sm">
          Total credit limit (£)
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="block text-sm">
          Current balance (£)
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        {limit > 0 && (
          <div className="mt-2 text-sm">
            <p>Utilisation: <span className="font-semibold">{utilisation}%</span></p>
            <p>Rating: <span className="font-semibold">{status}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
