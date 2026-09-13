import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import {
  SearchCheck, CheckCircle2, ShieldCheck, MapPin, Scale,
  DollarSign, Clock, ArrowRight, UserCheck, Sparkles, Send, Eye, X, Check, CreditCard
} from 'lucide-react';

export const MatchedSuppliersPage = ({ requirementId = 'req_1', onNavigate }) => {
  const { organization } = useAuth();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Direct Razorpay Instant Checkout Modal State
  const [directCheckoutRequest, setDirectCheckoutRequest] = useState(null);
  const [directCheckoutOpen, setDirectCheckoutOpen] = useState(false);

  // Send Purchase Request Modal
  const [requestModalSupplier, setRequestModalSupplier] = useState(null);
  const [requestQty, setRequestQty] = useState(8000);
  const [offerPrice, setOfferPrice] = useState(30.0);
  const [requestNote, setRequestNote] = useState('Standard purchase request for 8,000 kg Grade-A Tomato for puree processing.');
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');

  // Score Explanation Drawer
  const [expandedExplanationId, setExpandedExplanationId] = useState(null);

  const fetchMatches = async () => {
    try {
      const res = await api.getMatchesForRequirement(requirementId);
      if (res.success) {
        setMatchData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [requirementId]);

  const handleOpenSendRequest = (supplier) => {
    setRequestModalSupplier(supplier);
    setRequestQty(matchData?.requirement?.quantity_kg || 8000);
    setOfferPrice(matchData?.requirement?.max_price_per_kg || 30.0);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestModalSupplier) return;
    setSubmitting(true);
    try {
      const payload = {
        requirement_id: requirementId,
        produce_id: requestModalSupplier.produceId,
        buyer_id: organization ? organization.id : 'org_1',
        requested_qty_kg: parseFloat(requestQty),
        offered_price_per_kg: parseFloat(offerPrice),
        delivery_date: matchData?.requirement?.required_delivery_date || '2026-09-15',
        note: requestNote
      };

      const res = await api.createRequest(payload);
      if (res.success) {
        setRequestSuccess(`Purchase request successfully dispatched to ${requestModalSupplier.farmerName}!`);
        setTimeout(() => {
          setRequestSuccess('');
          setRequestModalSupplier(null);
          // Navigate to requests/negotiation page
          onNavigate('buyer-negotiations');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectRazorpayBuy = (supplier) => {
    const mockReq = {
      id: `instant_${Date.now()}`,
      crop_name: requirement?.crop_name || supplier.cropName,
      quality_grade: supplier.qualityGrade,
      farmer_name: supplier.farmerName,
      farmer_id: supplier.farmerId,
      produce_id: supplier.produceId,
      buyer_id: organization ? organization.id : 'org_1',
      buyer_company: organization ? organization.company_name : 'ABC Food Processing Pvt Ltd',
      requested_qty_kg: Math.min(supplier.availableQtyKg, requirement?.quantity_kg || 8000),
      offered_price_per_kg: supplier.pricePerKg,
      counter_price_per_kg: supplier.pricePerKg,
      delivery_location: requirement?.delivery_location || 'Eluru Processing Plant',
      farm_district: supplier.farmerDistrict
    };
    setDirectCheckoutRequest(mockReq);
    setDirectCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center animate-pulse">
        <SearchCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3 animate-bounce" />
        <h3 className="font-bold text-sm text-slate-900">Evaluating 5-Factor Rule-Based Matching Algorithm...</h3>
        <p className="text-xs text-slate-500 mt-1">
          Scoring quantity volumes (30%), quality grading (25%), Haversine radius (20%), delivery date (15%), and price (10%).
        </p>
      </div>
    );
  }

  const requirement = matchData?.requirement || {
    title: 'Procurement: 8,000 kg Grade-A Ripe Tomatoes for Puree Processing',
    quantity_kg: 8000,
    quality_grade: 'Grade A',
    max_price_per_kg: 30.0,
    required_delivery_date: '2026-09-15',
    preferred_location: 'Eluru District (within 50 km)'
  };

  const matches = matchData?.matches || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Smart Supply-Demand Matching Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">Algorithm: 5-Factor Rule-Based</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Matched Suppliers (Sections 19 & 20)
          </h2>
          <p className="text-xs text-slate-500">
            Ranked agricultural suppliers for requirement: <strong>{requirement.title}</strong>
          </p>
        </div>

        <button
          onClick={() => onNavigate('buyer-requirements')}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          Change Sourcing Need
        </button>
      </div>

      {requestSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-2xl font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Target Sourcing Baseline Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-3 mb-3">
          <span className="text-slate-400">Target Procurement Parameters:</span>
          <span className="font-mono text-emerald-400">Ceiling: ₹{requirement.max_price_per_kg}/kg</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Volume Needed:</span>
            <div className="font-black text-sm text-white">{Number(requirement.quantity_kg).toLocaleString()} kg</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Grade Required:</span>
            <div className="font-black text-sm text-white">{requirement.quality_grade}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Delivery Date:</span>
            <div className="font-black text-sm text-white">{requirement.required_delivery_date}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Target Region:</span>
            <div className="font-black text-sm text-white">{requirement.preferred_location}</div>
          </div>
        </div>
      </div>

      {/* Ranked Suppliers Cards (Section 19) */}
      <div className="space-y-4">
        {matches.map((supplier, idx) => {
          const isTopMatch = idx === 0;
          const isExpanded = expandedExplanationId === supplier.produceId;

          return (
            <div
              key={supplier.produceId}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition space-y-4 shadow-sm ${
                isTopMatch
                  ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-50/20 via-white to-white'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                    isTopMatch ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{supplier.farmerName}</h3>
                      {supplier.farmerVerified && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Supplier ✓</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {supplier.farmerVillage}, {supplier.farmerDistrict} • {supplier.distanceKm} km away • Reliability: <strong>{supplier.farmerReliability}%</strong>
                    </p>
                  </div>
                </div>

                {/* Match Score Badge (Section 19) */}
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-black text-sm border ${
                    supplier.finalMatchScore >= 90
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-xs'
                      : supplier.finalMatchScore >= 80
                      ? 'bg-blue-100 text-blue-950 border-blue-300'
                      : 'bg-amber-100 text-amber-950 border-amber-300'
                  }`}>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{supplier.finalMatchScore}% Match</span>
                  </div>
                </div>
              </div>

              {/* Specs Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Available Supply</span>
                  <div className="font-bold text-slate-900 mt-0.5">{Number(supplier.availableQtyKg).toLocaleString()} kg</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Quality Grade</span>
                  <div className="font-bold text-slate-900 mt-0.5">{supplier.qualityGrade}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Farmer Asking Price</span>
                  <div className="font-black text-emerald-800 text-sm mt-0.5">₹{supplier.pricePerKg}/kg</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Transit Distance</span>
                  <div className="font-bold text-slate-900 mt-0.5">{supplier.distanceKm} km away</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Delivery Compatibility</span>
                  <div className="font-bold text-emerald-700 mt-0.5">Compatible</div>
                </div>
              </div>

              {/* Section 20: Transparent Score Explanation Checkmarks */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Quantity (30%)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Quality (25%)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Location (20%)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Delivery (15%)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Price (10%)</span>
                    </span>
                  </div>

                  <button
                    onClick={() => setExpandedExplanationId(isExpanded ? null : supplier.produceId)}
                    className="text-[11px] font-bold text-emerald-800 hover:underline"
                  >
                    {isExpanded ? 'Hide Formula' : 'Why this score? →'}
                  </button>
                </div>

                {/* Section 20 Detailed Explanation Drawer */}
                {isExpanded && (
                  <div className="pt-2 border-t border-emerald-200/60 text-xs text-slate-700 space-y-1.5 font-medium animate-in fade-in duration-150">
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Mathematical Score Breakdown (Section 20):</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>• <strong>Quantity:</strong> {supplier.scoreBreakdown.quantity.explanation} ({supplier.scoreBreakdown.quantity.score}/30)</div>
                      <div>• <strong>Quality:</strong> {supplier.scoreBreakdown.quality.explanation} ({supplier.scoreBreakdown.quality.score}/25)</div>
                      <div>• <strong>Location:</strong> {supplier.scoreBreakdown.location.explanation} ({supplier.scoreBreakdown.location.score}/20)</div>
                      <div>• <strong>Delivery Date:</strong> {supplier.scoreBreakdown.delivery.explanation} ({supplier.scoreBreakdown.delivery.score}/15)</div>
                      <div>• <strong>Price:</strong> {supplier.scoreBreakdown.price.explanation} ({supplier.scoreBreakdown.price.score}/10)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (Section 19: [ View Supplier ] [ Send Request ]) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">
                  Reliability: <strong>{supplier.farmerReliability}%</strong> ({supplier.farmerTotalOrders || 12} previous orders • {supplier.farmerRating || 4.8}★)
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onNavigate('buyer-supplier-details', { farmerId: supplier.farmerId })}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                  >
                    View Dossier
                  </button>

                  <button
                    onClick={() => handleOpenSendRequest(supplier)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </button>

                  <button
                    onClick={() => handleDirectRazorpayBuy(supplier)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Instant Order & Pay via Razorpay</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Send Purchase Request Modal Dialog (Section 22) */}
      {requestModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Send Purchase Request</h3>
                <p className="text-xs text-slate-500">To {requestModalSupplier.farmerName} ({requestModalSupplier.farmerDistrict})</p>
              </div>
              <button
                onClick={() => setRequestModalSupplier(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Quantity (kg)
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Offered Price (₹/kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Farmer asks ₹{requestModalSupplier.pricePerKg}/kg. You can offer ₹{offerPrice}/kg.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Specifications Note
                </label>
                <textarea
                  rows={2}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalSupplier(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending Request...' : 'Send Request Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Instant Checkout Modal */}
      {directCheckoutOpen && directCheckoutRequest && (
        <CheckoutModal
          isOpen={directCheckoutOpen}
          request={directCheckoutRequest}
          onClose={() => setDirectCheckoutOpen(false)}
          onSuccess={(order) => {
            setDirectCheckoutOpen(false);
            if (onNavigate) onNavigate('buyer-orders');
          }}
        />
      )}
    </div>
  );
};
