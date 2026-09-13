import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Building2, Boxes, SearchCheck, ShoppingCart, Award,
  PlusCircle, ArrowRight, Truck, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock
} from 'lucide-react';

export const BuyerDashboard = ({ onNavigate }) => {
  const { organization, user } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const orgId = organization ? organization.id : 'org_1';
        const res = await api.getBuyerDashboard(orgId);
        setData(res);
      } catch (err) {
        console.error('Buyer dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [organization]);

  const metrics = data?.metrics || {
    activeRequirements: 4,
    matchedSuppliers: 18,
    pendingRequests: 3,
    activeOrders: 5,
    completedOrders: 21,
    trustScore: '95%'
  };

  const orgName = data?.organization?.company_name || organization?.company_name || 'ABC Food Processing Pvt Ltd';

  return (
    <div className="space-y-6">
      {/* Top Welcome Header (Section 15) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>{organization?.verified_status === 'VERIFIED' ? 'Corporate Procurement License Verified' : 'Corporate Verification Pending (Action Required)'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {orgName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Industrial Sourcing & Procurement • {organization?.address || 'Andhra Pradesh Facility'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('buyer-create-requirement')}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Procurement Need</span>
          </button>

          <button
            onClick={() => onNavigate('buyer-matches')}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-2"
          >
            <SearchCheck className="w-4 h-4 text-emerald-400" />
            <span>Matched Suppliers</span>
          </button>
        </div>
      </div>

      {/* Corporate Verification Alert Banner for newly registered buyers */}
      {(!organization || organization.verified_status !== 'VERIFIED') && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm">Business Credential Verification Required</div>
              <p className="text-xs text-blue-100 mt-0.5">
                Authenticate your corporate GSTIN or Trade License to match verified farmers and confirm purchase orders.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('buyer-profile')}
            className="px-4 py-2 bg-white hover:bg-blue-50 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition"
          >
            Verify Corporate GST Now →
          </button>
        </div>
      )}

      {/* Justified Buyer Procurement Pipeline */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Guided Buyer Procurement Pipeline</span>
            <span className="hidden sm:inline text-[11px] text-slate-400">• End-to-end verified sourcing</span>
          </div>
          <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            5 Core Steps
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-left">
          <button
            onClick={() => onNavigate('buyer-create-requirement')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-blue-700">STEP 1</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Post Requirement</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Specify crop, tonnage & price</div>
          </button>

          <button
            onClick={() => onNavigate('buyer-matches')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group bg-blue-50/20"
          >
            <div className="text-[10px] font-bold text-blue-700">STEP 2</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">AI Smart Matching</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">5-Factor supplier scoring</div>
          </button>

          <button
            onClick={() => onNavigate('buyer-negotiations')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-blue-700">STEP 3</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Negotiate Terms</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Bilateral counter-offer chat</div>
          </button>

          <button
            onClick={() => onNavigate('buyer-orders')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-blue-700">STEP 4</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Confirm & Dispatch</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Order seal & verification ID</div>
          </button>

          <button
            onClick={() => onNavigate('farmer-delivery')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
          >
            <div className="text-[10px] font-bold text-slate-400 group-hover:text-blue-700">STEP 5</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">Track & Inspect</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">GPS route & weighbridge</div>
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 15 Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Requirements</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.activeRequirements}</div>
          <div className="text-[10px] text-slate-400 mt-1">Open for quotation</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Matched Suppliers</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.matchedSuppliers}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Verified farm lots</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Pending Requests</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pendingRequests}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Under negotiation</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Orders</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{metrics.activeOrders}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">In fulfillment / transit</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Completed Orders</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.completedOrders}</div>
          <div className="text-[10px] text-slate-400 mt-1">Inspected & cleared</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Buyer Trust Score</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.trustScore}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Grade-A Corporate</div>
        </div>
      </div>

      {/* Two Column Layout: Matched Suppliers Quick Card + Recent Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premier Matched Supplier Card (Farmer Ramesh Kumar - Section 19) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SearchCheck className="w-4 h-4 text-emerald-600" />
              #1 Ranked Supplier Match (Section 19)
            </h4>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              95% Match Score
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-extrabold text-sm text-slate-900">#1 Farmer Ramesh Kumar</h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sanivarapupeta, Eluru (12 km away) • Reliability: <strong>92%</strong> (14 Orders)
                </p>
              </div>
              <span className="text-sm font-black text-emerald-800">₹29/kg</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
                <span className="text-slate-400 text-[10px]">Produce Lot</span>
                <div className="font-bold text-slate-900">Tomato (Grade A)</div>
              </div>
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
                <span className="text-slate-400 text-[10px]">Available Supply</span>
                <div className="font-bold text-slate-900">10,000 kg</div>
              </div>
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
                <span className="text-slate-400 text-[10px]">Your Need</span>
                <div className="font-bold text-slate-900">8,000 kg</div>
              </div>
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-100">
                <span className="text-slate-400 text-[10px]">Budget Ceiling</span>
                <div className="font-bold text-emerald-700">Max ₹30/kg</div>
              </div>
            </div>

            {/* Score Breakdown Checkmarks (Section 20) */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-emerald-900 pt-1">
              <span>✓ Quantity (30%)</span>
              <span>✓ Quality (25%)</span>
              <span>✓ Location (20%)</span>
              <span>✓ Delivery (15%)</span>
              <span>✓ Price (10%)</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
              <button
                onClick={() => onNavigate('buyer-matches')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                Send Purchase Request (₹30/kg)
              </button>
              <button
                onClick={() => onNavigate('buyer-matches')}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition"
              >
                View Transparent Score
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Also matched: Farmer Suresh (89%), Farmer Kumar (83%)</span>
            <button
              onClick={() => onNavigate('buyer-matches')}
              className="font-bold text-emerald-700 hover:underline"
            >
              See all 18 matches →
            </button>
          </div>
        </div>

        {/* Active Consignment & Delivery Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Incoming Delivery Telematics
            </h4>
            <button
              onClick={() => onNavigate('farmer-delivery')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>GPS View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">Order: AGRI-2026-001024</span>
              <StatusBadge status="In Transit" size="xs" />
            </div>

            <div className="text-xs font-semibold text-slate-200">
              Tomato 8,000 kg (Grade A) • From Farmer Ramesh (Eluru)
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400">Distance Remaining</span>
                <div className="font-bold text-emerald-400 text-sm">24.5 km</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Estimated Arrival</span>
                <div className="font-bold text-white text-sm">Today, 5:30 PM</div>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Driver: Ravi Kumar (AP 37 TE 1234)</span>
              <button
                onClick={() => onNavigate('farmer-delivery')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Track Live Telematics →
              </button>
            </div>
          </div>

          {/* Quick links to Create Requirement & Inspection */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigate('buyer-create-requirement')}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-emerald-300 transition"
            >
              <div className="font-bold text-xs text-slate-900">+ New Sourcing Need</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Specify grade & price ceiling</p>
            </button>

            <button
              onClick={() => onNavigate('buyer-orders')}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left hover:border-emerald-300 transition"
            >
              <div className="font-bold text-xs text-slate-900">Delivery Inspection</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Accept or Report Issue</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
