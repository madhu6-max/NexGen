import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Info, Calendar, Sparkles } from 'lucide-react';

export const MarketPriceChart = ({ intelData }) => {
  const [activeTab, setActiveTab] = useState('30d');

  if (!intelData) return null;

  const {
    crop, currentMarketPrice, currentPriceNum, futurePriceEstimate,
    recommendedAction, trend, historicalPrices
  } = intelData;

  const dataPoints = activeTab === '30d'
    ? historicalPrices.thirtyDays
    : activeTab === '90d'
    ? historicalPrices.ninetyDays
    : historicalPrices.oneYear;

  // Compute SVG chart coordinates
  const prices = dataPoints.map(p => p.price);
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05;
  const range = maxP - minP || 1;

  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 40;

  const pointsString = dataPoints.map((dp, i) => {
    const x = padding + (i / (dataPoints.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((dp.price - minP) / range) * (svgHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              APMC Mandi Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">Eluru Cluster, AP</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {crop ? crop.name : 'Tomato'} Price Analytics & Forecast
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Past 30 Days
          </button>
          <button
            onClick={() => setActiveTab('90d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === '90d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Past 90 Days
          </button>
          <button
            onClick={() => setActiveTab('1y')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === '1y' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Past 1 Year
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Section 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Market Price */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div className="text-xs font-medium text-slate-500">Current Spot Price</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{currentMarketPrice}</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{trend?.label || '↑ Increasing'}</span>
          </div>
        </div>

        {/* Future Price Estimate */}
        <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200">
          <div className="text-xs font-medium text-emerald-800">Expected Price Range</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {futurePriceEstimate?.range || '₹27 - ₹32/kg'}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Next 14 Days Rolling Window
          </div>
        </div>

        {/* Recommended Action */}
        <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200">
          <div className="text-xs font-medium text-blue-800">Recommended Listing Price</div>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {recommendedAction?.listingRange || '₹29 - ₹31/kg'}
          </div>
          <div className="text-[11px] text-blue-700 mt-1 font-medium">
            Fastest Liquidity & Buyer Demand
          </div>
        </div>
      </div>

      {/* SVG Interactive Line Chart */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
          <span>₹/kg Price History ({activeTab.toUpperCase()})</span>
          <span>Max: ₹{Math.round(maxP)}/kg • Min: ₹{Math.round(minP)}/kg</span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48">
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0.25, 0.5, 0.75].map((pct, idx) => (
              <line
                key={idx}
                x1={padding}
                y1={padding + pct * (svgHeight - padding * 2)}
                x2={svgWidth - padding}
                y2={padding + pct * (svgHeight - padding * 2)}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Area Fill */}
            <polygon
              points={`${padding},${svgHeight - padding} ${pointsString} ${svgWidth - padding},${svgHeight - padding}`}
              fill="url(#priceGrad)"
            />

            {/* Price Line */}
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />

            {/* Data Dots and Labels */}
            {dataPoints.map((dp, i) => {
              const x = padding + (i / (dataPoints.length - 1)) * (svgWidth - padding * 2);
              const y = svgHeight - padding - ((dp.price - minP) / range) * (svgHeight - padding * 2);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ₹{dp.price}
                  </text>
                  <text
                    x={x}
                    y={svgHeight - 15}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                  >
                    {dp.date || dp.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Mandatory Section 9 Disclaimer Box */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Indicative market estimate</div>
          <p className="text-amber-800 leading-relaxed">
            Market intelligence estimates are derived from APMC mandi arrival records and seasonal supply algorithms. These figures represent indicative market guidance and are not guaranteed future pricing.
          </p>
        </div>
      </div>
    </div>
  );
};
