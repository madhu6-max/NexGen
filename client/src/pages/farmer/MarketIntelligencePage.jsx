import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MarketPriceChart } from '../../components/charts/MarketPriceChart';
import {
  TrendingUp, Search, Calendar, MapPin, Scale, ArrowRight,
  Sparkles, CheckCircle2, DollarSign
} from 'lucide-react';

export const MarketIntelligencePage = ({ onNavigate }) => {
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('crop_tomato');
  const [location, setLocation] = useState('Eluru, Andhra Pradesh');
  const [quantity, setQuantity] = useState(10000);
  const [expectedDate, setExpectedDate] = useState('2026-09-15');
  const [intelData, setIntelData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load crop list
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await api.getCrops();
        if (res.crops) {
          setCrops(res.crops);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCrops();
  }, []);

  // Fetch intelligence data whenever crop or location changes
  useEffect(() => {
    const fetchIntel = async () => {
      setLoading(true);
      try {
        const res = await api.getMarketIntelligence(selectedCropId, { location, quantity, expectedSellingDate: expectedDate });
        setIntelData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIntel();
  }, [selectedCropId, location, quantity, expectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Market Price Intelligence</h2>
          <p className="text-xs text-slate-500">
            Real-time APMC Mandi price discovery, seasonal volume arrivals, and AI predictive selling guidance
          </p>
        </div>

        <button
          onClick={() => onNavigate('farmer-add-produce')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <span>List Produce with this Price</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selector Filters Bar (Section 9 Requirement) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Configure Batch Parameters for Price Modeling
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Crop</label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.variety || c.category})
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mandi / District Location</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity (kg)</label>
            <div className="relative">
              <Scale className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                step="500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Expected Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Selling Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center animate-pulse">
          <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-bounce" />
          <p className="text-xs font-semibold text-slate-600">Calculating mandi regression trends and volume arrivals...</p>
        </div>
      ) : (
        <MarketPriceChart intelData={intelData} />
      )}
    </div>
  );
};
