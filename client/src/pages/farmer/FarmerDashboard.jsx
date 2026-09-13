import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Boxes, ShoppingCart, MessageSquare, Award, TrendingUp,
  CheckCircle2, AlertCircle, ArrowRight, Truck, PlusCircle, ShieldCheck, ShieldAlert,
  Sparkles, Building2
} from 'lucide-react';

export const FarmerDashboard = ({ onNavigate }) => {
  const { farmer, user } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const farmerId = farmer ? farmer.id : 'frm_1';
        const res = await api.getFarmerDashboard(farmerId);
        setData(res);
      } catch (err) {
        console.error('Farmer dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [farmer]);

  const metrics = data?.metrics || {
    totalProduceTons: '25.0',
    activeListings: 5,
    pendingRequests: 3,
    activeOrders: 2,
    completedOrders: 12,
    reliability: '92%'
  };

  const farmerName = data?.farmer?.name || farmer?.name || 'Ramesh';

  return (
    <div className="space-y-6">
      {/* Top Welcome Header (Section 6) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>{farmer?.verified_status === 'VERIFIED' ? 'Verified Producer (Pattadar Passbook Validated)' : 'Verification Pending (Action Required)'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {farmerName}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-xl">
            {farmer?.district || 'Eluru'}, Andhra Pradesh • Godavari Delta Agricultural Cluster
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('farmer-add-produce')}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Produce</span>
          </button>
          <button
            onClick={() => onNavigate('farmer-market')}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Market Intel</span>
          </button>
        </div>
      </div>

      {/* Farm Verification Alert Banner for newly registered farmers */}
      {(!farmer || farmer.verified_status !== 'VERIFIED') && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm">Farm & Land Verification Required (Action Needed)</div>
              <p className="text-xs text-amber-100 mt-0.5">
                Complete the 4-step verification (Aadhaar KYC, Pattadar Passbook, GPS Geotag, Produce Quality) to certify your produce for B2B buyers.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('farmer-verification')}
            className="px-4 py-2 bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition"
          >
            Complete 4-Step Verification Now →
          </button>
        </div>
      )}

      {/* Justified Trade Pipeline Workflow Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Guided Farmer Trade Pipeline</span>
            <span className="hidden sm:inline text-[11px] text-slate-400">• Step-by-step verified workflow</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            6 Core Steps
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-left">
          <button
            onClick={() => onNavigate('farmer-verification')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">STEP 1</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Farm Land KYC</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">4-step land verification</div>
          </button>

          <button
            onClick={() => onNavigate('farmer-market')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">STEP 2</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">APMC Mandi Rates</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Price spot & 90d forecast</div>
          </button>

          <button
            onClick={() => onNavigate('farmer-add-produce')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">STEP 3</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Add Produce</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Publish harvest quantity</div>
          </button>

          <button
            onClick={() => onNavigate('farmer-produce-verify')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">STEP 4</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">AI Quality Check</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Visual grade assessment</div>
          </button>

          <button
            onClick={() => onNavigate('farmer-requests')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">STEP 5</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Buyer Negotiations</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Counter-offer & accept</div>
          </button>

          <button
            onClick={() => onNavigate('farmer-delivery')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group bg-emerald-50/30"
          >
            <div className="text-[10px] font-bold text-emerald-700">STEP 6</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">GPS Fleet Telematics</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Live NH-16 truck corridor</div>
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 6 Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Produce</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalProduceTons} <span className="text-xs font-normal">Tons</span></div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Available across lots</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Listings</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.activeListings}</div>
          <div className="text-[10px] text-slate-400 mt-1">Ready for buyers</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Pending Requests</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pendingRequests}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Awaiting your offer</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Orders</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{metrics.activeOrders}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">In fulfillment / transit</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Completed Orders</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.completedOrders}</div>
          <div className="text-[10px] text-slate-400 mt-1">100% Escrow cleared</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Reliability</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.reliability}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Top Tier Grade</div>
        </div>
      </div>

      {/* High-Compatibility Buyer Demands (Smart Matches) */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'लाइव स्मार्ट खरीदार मांगें' : language === 'te' ? 'లైవ్ స్మార్ట్ కొనుగోలుదారుల డిమాండ్లు' : 'Live High-Match Buyer Demands'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/30">
                  95% Top Match
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Commercial food processors looking for your registered crops right now
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('smart-matching')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <span>{language === 'hi' ? 'सभी मैच देखें' : language === 'te' ? 'అన్ని మ్యాచ్‌లు చూడండి' : 'Open Matching Hub'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Demand 1 */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2 hover:bg-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                ABC Food Processing
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px]">
                95% MATCH
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Tomato (Grade A) • Needs <strong className="text-white">8,000 kg</strong> at <strong className="text-emerald-300">₹30/kg</strong>
            </div>
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Eluru (12 km away)</span>
              <button
                onClick={() => onNavigate('smart-matching')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Send Offer →
              </button>
            </div>
          </div>

          {/* Demand 2 */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2 hover:bg-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Andhra Pickles Ltd
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px]">
                91% MATCH
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Red Chilli • Needs <strong className="text-white">3,000 kg</strong> at <strong className="text-emerald-300">₹220/kg</strong>
            </div>
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Guntur (45 km away)</span>
              <button
                onClick={() => onNavigate('smart-matching')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Send Offer →
              </button>
            </div>
          </div>

          {/* Demand 3 */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2 hover:bg-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Coastal Agro Exports
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 text-slate-950 font-black text-[10px]">
                88% MATCH
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Paddy Rice (BPT) • Needs <strong className="text-white">10,000 kg</strong> at <strong className="text-emerald-300">₹27/kg</strong>
            </div>
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Vijayawada (28 km away)</span>
              <button
                onClick={() => onNavigate('smart-matching')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Send Offer →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Buyer Inquiries + Active Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Buyer Requests */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Recent Commercial Inquiries (Section 13)
            </h4>
            <button
              onClick={() => onNavigate('farmer-requests')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Demo Highlight Request: ABC Foods */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">ABC Food Processing Pvt Ltd</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">95% Match</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tomato • <strong>8,000 kg</strong> Grade A @ <strong>₹30/kg</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Delivery by Sept 15 • Eluru Industrial Hub (12 km away)
                  </p>
                </div>
                <StatusBadge status="Pending" />
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60">
                <button
                  onClick={() => onNavigate('farmer-requests')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Review & Counter Offer
                </button>
                <span className="text-[11px] text-slate-500">Tomato listing prod_1 (10,000 kg available)</span>
              </div>
            </div>

            {/* Other request */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition space-y-2">
              <div className="flex items-start justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">Godavari Fresh Wholesalers</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Maize • 5,000 kg @ ₹22.5/kg</p>
                </div>
                <StatusBadge status="Counter_Offered" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Order & GPS Tracking Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Active Consignment in Transit (Section 25)
            </h4>
            <StatusBadge status="In Transit" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Order ID: AGRI-2026-001024</span>
              <span className="text-emerald-400 font-bold">Driver: Ravi Kumar</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <div className="text-[10px] text-slate-400">Route</div>
                <div className="font-bold text-slate-100">Eluru → Rajahmundry (65 km)</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Est. Delivery</div>
                <div className="font-bold text-emerald-300">Today, 5:30 PM</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '62%' }}></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Vehicle: AP 37 TE 1234</span>
              <button
                onClick={() => onNavigate('farmer-delivery')}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <span>Live GPS Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick links to verification and market */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigate('farmer-verification')}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-emerald-300 transition"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verification Center</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">4 of 4 Steps Verified</p>
            </button>

            <button
              onClick={() => onNavigate('farmer-market')}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-emerald-300 transition"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Price Alert</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Tomato ↑ ₹28/kg spot</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
