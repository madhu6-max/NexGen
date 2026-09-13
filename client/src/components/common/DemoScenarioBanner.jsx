import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, UserCheck, Building2, ShieldAlert, Truck, ChevronDown, ChevronUp, CheckCircle, RotateCcw, Trash2 } from 'lucide-react';

export const DemoScenarioBanner = ({ onNavigate }) => {
  const { role, switchDemoRole, user, farmer, organization, resetToCleanSlate, restoreSampleDemo } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const steps = [
    { title: '1. Register Farmer', desc: 'Create farmer profile & complete 4-step land verification', role: 'farmer', page: 'farmer-verification' },
    { title: '2. Check APMC Market', desc: 'Inspect mandi spot prices & future forecasts', role: 'farmer', page: 'farmer-market' },
    { title: '3. Add Produce Lot', desc: 'Publish harvest lot & verify quality grade with AI', role: 'farmer', page: 'farmer-add-produce' },
    { title: '4. Register Buyer', desc: 'Create corporate profile & verify GSTIN credential', role: 'buyer', page: 'buyer-profile' },
    { title: '5. Post Requirement', desc: 'Declare procurement need (volume, variety & max price)', role: 'buyer', page: 'buyer-create-requirement' },
    { title: '6. Smart Match & Deal', desc: '95% rule-based match score & counter-offer negotiation', role: 'buyer', page: 'buyer-matches' },
    { title: '7. Confirm & Seal', desc: 'Buyer confirmation generates Order & VER-AGRI Seal', role: 'buyer', page: 'buyer-orders' },
    { title: '8. GPS Fleet & Review', desc: 'Track highway transit on NH-16 & reciprocal rating', role: 'farmer', page: 'farmer-delivery' },
  ];

  return (
    <aside aria-label="Hackathon judge demonstration control panel" className="bg-slate-900 text-white border-b border-slate-800 text-xs shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Hackathon badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            {role === 'guest' ? 'Fresh Slate (0 Users)' : 'Active Session'}
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Role: <strong className="text-white capitalize">{role}</strong> {user ? `• ${user.name}` : '• Not signed in'}
            {farmer && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${farmer.verified_status === 'VERIFIED' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700' : 'bg-amber-900/80 text-amber-300 border border-amber-700'}`}>
                {farmer.verified_status === 'VERIFIED' ? 'Certified 4/4' : 'KYC Pending'}
              </span>
            )}
            {organization && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${organization.verified_status === 'VERIFIED' ? 'bg-blue-900/80 text-blue-300 border border-blue-700' : 'bg-amber-900/80 text-amber-300 border border-amber-700'}`}>
                {organization.verified_status === 'VERIFIED' ? 'GST Verified' : 'GST Pending'}
              </span>
            )}
          </span>
        </div>

        {/* Center: Action Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {/* Clean Slate Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset database to clean slate (0 users)? You will be able to add 1 farmer and 1 buyer from scratch.')) {
                resetToCleanSlate();
              }
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold flex items-center gap-1.5 transition"
            title="Reset DB to 0 users"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset to 0 Users</span>
          </button>

          {/* Quick Demo Restore Button */}
          <button
            onClick={() => {
              if (window.confirm('Load pre-populated Section 51 demo scenario (Ramesh Kumar & ABC Foods)?')) {
                restoreSampleDemo();
                onNavigate && onNavigate('farmer-dashboard');
              }
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center gap-1.5 transition"
            title="Load Section 51 demo dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Demo Data</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden md:block"></div>

          {/* Role Navigation buttons */}
          {user ? (
            <button
              onClick={() => onNavigate && onNavigate(`${role}-dashboard`)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Go to My Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate && onNavigate('auth')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Register Farmer / Buyer →</span>
            </button>
          )}

          <button
            onClick={() => onNavigate && onNavigate('farmer-delivery')}
            className="px-2.5 py-1.5 rounded-lg bg-teal-800/60 hover:bg-teal-700 text-teal-200 flex items-center gap-1 transition"
            title="Live GPS Fleet Simulation"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GPS Fleet</span>
          </button>
        </div>

        {/* Right: Expand Flow Guide */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition font-medium"
        >
          <span>{expanded ? 'Hide Trade Flow' : 'Step-by-Step Flow'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Walkthrough Drawer */}
      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                Complete Lifecycle Demonstration (From Scratch)
              </span>
              <span className="text-[10px] text-slate-400">Click any step to navigate</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {steps.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate && onNavigate(s.page)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-left transition group"
                >
                  <div className="font-bold text-emerald-400 text-[11px] group-hover:text-emerald-300 truncate">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
