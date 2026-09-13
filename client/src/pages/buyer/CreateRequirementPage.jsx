import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  FilePlus2, SearchCheck, MapPin, Scale, Award, DollarSign,
  Calendar, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';

export const CreateRequirementPage = ({ onNavigate }) => {
  const { organization } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State matching Section 17
  const [cropId, setCropId] = useState('crop_tomato');
  const [quantity, setQuantity] = useState(8000);
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [minPrice, setMinPrice] = useState(25.0);
  const [maxPrice, setMaxPrice] = useState(30.0);
  const [prefLocation, setPrefLocation] = useState('Eluru District (within 50 km)');
  const [maxDist, setMaxDist] = useState(50);
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15');
  const [deliveryLocation, setDeliveryLocation] = useState('ABC Food Processing Unit, Industrial Area, Eluru');
  const [specialReqs, setSpecialReqs] = useState('Brix sweetness minimum 4.5, defect < 2%, uniform firmness for automated washing & pulping.');

  const estMinTotal = Math.round((parseFloat(quantity) || 0) * (parseFloat(minPrice) || 0));
  const estMaxTotal = Math.round((parseFloat(quantity) || 0) * (parseFloat(maxPrice) || 0));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedCrop = crops.find(c => c.id === cropId) || { name: 'Tomato' };
      const payload = {
        buyer_id: organization ? organization.id : 'org_1',
        crop_id: cropId,
        title: `Procurement: ${Number(quantity).toLocaleString()} kg ${qualityGrade} ${selectedCrop.name} for Industrial Processing`,
        quantity_kg: parseFloat(quantity),
        quality_grade: qualityGrade,
        min_price_per_kg: parseFloat(minPrice),
        max_price_per_kg: parseFloat(maxPrice),
        preferred_location: prefLocation,
        max_distance_km: parseFloat(maxDist),
        required_delivery_date: deliveryDate,
        delivery_location: deliveryLocation,
        delivery_lat: 16.7190,
        delivery_lng: 81.1090,
        special_requirements: specialReqs
      };

      const res = await api.createRequirement(payload);
      if (res.success) {
        // Jump to matching engine (Section 19)
        onNavigate('buyer-matches', { requirementId: res.requirement.id });
      }
    } catch (err) {
      console.error('Failed to create procurement requirement:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Create Procurement Requirement (Section 17)</h2>
        <p className="text-xs text-slate-500">
          Publish institutional sourcing demands and activate the 5-factor supplier matching algorithm
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Master Demo Scenario Highlight */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Main Live Demonstration Scenario Pre-Filled:</span>
            <p className="text-emerald-800 mt-0.5">
              8,000 kg Grade-A Tomato @ Max ₹30/kg within 50 km delivery by Sept 15 for ABC Food Processing. Matches Farmer Ramesh at 95%!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Product */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product / Crop Required
              </label>
              <select
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Required */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Required (kg)
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="500"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Quality Required */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quality Grade Required
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
              >
                <option value="Grade A">Grade A (Puree & Pulping Spec)</option>
                <option value="Grade B">Grade B (Standard Commercial)</option>
                <option value="Grade C">Grade C (Industrial Distillation)</option>
              </select>
            </div>

            {/* Minimum Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Minimum Price (₹/kg)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 font-bold text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs pl-7 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-emerald-800"
                />
              </div>
            </div>

            {/* Maximum Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Price Ceiling (₹/kg)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 font-bold text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs pl-7 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-emerald-800"
                />
              </div>
            </div>

            {/* Preferred Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Sourcing Location
              </label>
              <input
                type="text"
                value={prefLocation}
                onChange={(e) => setPrefLocation(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Maximum Distance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Radius (km)
              </label>
              <input
                type="number"
                value={maxDist}
                onChange={(e) => setMaxDist(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
            </div>

            {/* Required Delivery Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Delivery Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Delivery Location */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unloading Facility / Plant Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Centralized Requirement Cost Calculation Display */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-300/80 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-700" />
                <h4 className="font-extrabold text-sm text-slate-900">Estimated Total Procurement Cost Range</h4>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Quantity: {Number(quantity || 0).toLocaleString()} kg @ ₹{minPrice} - ₹{maxPrice}/kg
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/90 p-4 rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Estimated Minimum Total:</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  ₹{estMinTotal.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Calculation: {Number(quantity || 0).toLocaleString()} kg × ₹{minPrice}/kg
                </p>
              </div>

              <div className="bg-white/90 p-4 rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Estimated Maximum Total:</span>
                <div className="text-2xl font-black text-teal-900 mt-1">
                  ₹{estMaxTotal.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Calculation: {Number(quantity || 0).toLocaleString()} kg × ₹{maxPrice}/kg
                </p>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Technical Specifications & Laboratory Parameters
            </label>
            <textarea
              rows={3}
              value={specialReqs}
              onChange={(e) => setSpecialReqs(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Button: Section 17 [ Find Matching Suppliers ] */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2.5 disabled:opacity-50"
            >
              <SearchCheck className="w-5 h-5 text-emerald-200" />
              <span>{loading ? 'Analyzing Matches...' : 'Find Matching Suppliers (Section 17)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
