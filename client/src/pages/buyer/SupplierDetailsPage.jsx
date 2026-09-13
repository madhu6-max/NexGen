import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  User, CheckCircle2, ShieldCheck, MapPin, Award,
  Truck, Star, Phone, Mail, ArrowLeft, ArrowRight, Boxes
} from 'lucide-react';

export const SupplierDetailsPage = ({ farmerId = 'frm_1', onNavigate }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await api.getFarmerProfile(farmerId);
        setProfile(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [farmerId]);

  const f = profile?.farmer || {
    name: 'Ramesh Kumar',
    village: 'Sanivarapupeta',
    district: 'Eluru',
    state: 'Andhra Pradesh',
    farm_size_acres: 12.5,
    experience_years: 18,
    fpo_name: 'Godavari Delta Vegetable FPO',
    reliability_score: 92,
    rating: 4.8,
    total_orders: 14,
    phone: '+91 98480 12345'
  };

  const ratings = profile?.ratings || [
    {
      id: 'rat_1',
      rating_overall: 4.9,
      quality_rating: 5.0,
      quantity_rating: 5.0,
      delivery_rating: 4.8,
      comment: 'Outstanding tomato quality. Ramesh delivered exactly on time with pristine sorting.',
      created_at: '2026-08-16'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('buyer-matches')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Matched Suppliers</span>
        </button>

        <button
          onClick={() => onNavigate('buyer-matches')}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
        >
          Send Purchase Request
        </button>
      </div>

      {/* Supplier Profile Hero Card (Section 21) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-2xl border border-emerald-200">
              👨‍🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{f.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Supplier ✓</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {f.village}, {f.district}, {f.state} • {f.fpo_name}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Supplier Rating</div>
            <div className="flex items-center gap-1 justify-end font-black text-xl text-slate-900 mt-0.5">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>{f.rating} / 5.0</span>
            </div>
          </div>
        </div>

        {/* Section 21 Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="text-xs text-slate-400">Previous Orders</div>
            <div className="text-xl font-black text-slate-900 mt-1">12 Orders</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Completed Escrow</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="text-xs text-slate-400">Successful Deliveries</div>
            <div className="text-xl font-black text-emerald-700 mt-1">11 Deliveries</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero Disputes</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="text-xs text-slate-400">On-Time Delivery %</div>
            <div className="text-xl font-black text-blue-700 mt-1">92% On-Time</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fleet Integrated</div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="text-xs text-emerald-800 font-semibold">Reliability Score</div>
            <div className="text-xl font-black text-emerald-950 mt-1">{f.reliability_score}%</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Top Tier Producer</div>
          </div>
        </div>

        {/* Farm & Agronomic Data */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 text-[11px]">Cultivated Land Holding</span>
            <div className="font-bold text-slate-900 mt-0.5">{f.farm_size_acres} Acres (Owner-Cultivator)</div>
            <div className="text-[10px] text-slate-500">Soil: Alluvial Red Loam</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 text-[11px]">Farming Experience</span>
            <div className="font-bold text-slate-900 mt-0.5">{f.experience_years} Years Commercial Growing</div>
            <div className="text-[10px] text-slate-500">Irrigation: Drip & Borewell</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 text-[11px]">Verification Stamp</span>
            <div className="font-bold text-emerald-700 mt-0.5">Pattadar Passbook #142/2A</div>
            <div className="text-[10px] text-slate-500">Revenue Dept Validated</div>
          </div>
        </div>

        {/* Ratings & Comments (Section 21) */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Buyer Ratings & Testimonials
          </h4>

          {ratings.map((rat, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">ABC Food Processing Review</span>
                <span className="font-mono text-amber-600 font-bold">★ {rat.rating_overall || 4.9} / 5.0</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed italic">
                "{rat.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
