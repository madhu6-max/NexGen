import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  X, ShieldCheck, MapPin, Scale, DollarSign, Calendar,
  Sparkles, CheckCircle2, Send, ArrowRight, Loader2, Building2
} from 'lucide-react';

export const FarmerMatchedBuyersModal = ({ isOpen, onClose, produce, onProposalSent }) => {
  const [loading, setLoading] = useState(true);
  const [matchedBuyers, setMatchedBuyers] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  // Proposal modal state
  const [proposingBuyer, setProposingBuyer] = useState(null);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalQty, setProposalQty] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && produce) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      setProposingBuyer(null);
      api.getMatchesForProduce(produce.id)
        .then(res => {
          if (res.success && res.matches) {
            setMatchedBuyers(res.matches);
            if (res.matches.length > 0) {
              setExpandedMatchId(res.matches[0].requirementId);
            }
          }
        })
        .catch(err => {
          console.error(err);
          setErrorMsg('Failed to load matched buyer requirements.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, produce]);

  if (!isOpen || !produce) return null;

  const handleOpenProposal = (buyerMatch) => {
    setProposingBuyer(buyerMatch);
    setProposalPrice(produce.expected_price_per_kg || buyerMatch.maxPricePerKg);
    setProposalQty(Math.min(produce.available_qty_kg, buyerMatch.quantityKg));
    setProposalNote(`Commercial offer for ${produce.crop_name} (${produce.quality_grade}) from verified farm batch.`);
  };

  const handleSendProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposingBuyer) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.sendFarmerProposal({
        produce_id: produce.id,
        requirement_id: proposingBuyer.requirementId,
        offered_price_per_kg: parseFloat(proposalPrice),
        offered_qty_kg: parseFloat(proposalQty),
        delivery_date: proposingBuyer.requiredDeliveryDate,
        note: proposalNote
      });

      if (res.success) {
        setSuccessMsg(`Proposal successfully sent to ${proposingBuyer.buyerCompany}!`);
        setTimeout(() => {
          setProposingBuyer(null);
          setSuccessMsg('');
          if (onProposalSent) onProposalSent(res.request);
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Failed to submit proposal.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error dispatching proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-black text-xl">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Smart Matching Engine
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Produce Batch: #{produce.id.slice(-6)}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Matched Buyers for {produce.title || produce.crop_name}
              </h3>
              <p className="text-xs text-slate-500">
                Available: <strong>{Number(produce.available_qty_kg).toLocaleString()} kg</strong> at <strong>₹{produce.expected_price_per_kg}/kg</strong> ({produce.quality_grade})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-700">Evaluating 5-Factor Rule-Based Match Scores...</p>
              <p className="text-[11px] text-slate-400 mt-1">Comparing Quantity, Quality Grade, Proximity, Date & Budget ceiling</p>
            </div>
          ) : matchedBuyers.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No active buyer requirements found for this crop right now.</h4>
              <p className="text-xs text-slate-500 mt-1">
                New buyer purchase requirements are posted daily on AgriLink. Your batch remains listed for smart matching.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Found <strong>{matchedBuyers.length} Verified Buyer Requirements</strong> matching this crop:</span>
                <span className="text-[11px] font-mono text-emerald-700 font-bold">5-Factor Scored & Ranked</span>
              </div>

              {matchedBuyers.map((buyerMatch) => {
                const isExpanded = expandedMatchId === buyerMatch.requirementId;
                const score = buyerMatch.finalMatchScore;
                const isHighMatch = score >= 85;

                return (
                  <div
                    key={buyerMatch.requirementId}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isHighMatch
                        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/40 via-white to-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border flex-shrink-0 ${
                          isHighMatch
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {score}%
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {buyerMatch.buyerCompany}
                            </h4>
                            {buyerMatch.buyerVerified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified Buyer
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {buyerMatch.buyerBusinessType || 'Food Processor'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-1 font-medium">
                            {buyerMatch.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Scale className="w-3.5 h-3.5 text-slate-400" />
                              Demand: {Number(buyerMatch.quantityKg).toLocaleString()} kg
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                              Budget: up to ₹{buyerMatch.maxPricePerKg}/kg
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {buyerMatch.distanceKm} km away ({buyerMatch.buyerDistrict})
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Needs by: {buyerMatch.requiredDeliveryDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setExpandedMatchId(isExpanded ? null : buyerMatch.requirementId)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          {isExpanded ? 'Hide Details' : 'Score Breakdown'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProposal(buyerMatch)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Offer</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Score Breakdown */}
                    {isExpanded && buyerMatch.scoreBreakdown && (
                      <div className="p-4 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl text-xs space-y-2.5">
                        <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                          <span>5-FACTOR COMPATIBILITY BREAKDOWN:</span>
                          <span className="text-emerald-700">Overall Match: {score}%</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Quantity (30%)</span>
                              <span className="text-emerald-600 font-bold">{buyerMatch.scoreBreakdown.quantity.score}/30</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{buyerMatch.scoreBreakdown.quantity.explanation}</p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Quality (25%)</span>
                              <span className="text-emerald-600 font-bold">{buyerMatch.scoreBreakdown.quality.score}/25</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{buyerMatch.scoreBreakdown.quality.explanation}</p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Proximity (20%)</span>
                              <span className="text-emerald-600 font-bold">{buyerMatch.scoreBreakdown.location.score}/20</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{buyerMatch.scoreBreakdown.location.explanation}</p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Delivery Date (15%)</span>
                              <span className="text-emerald-600 font-bold">{buyerMatch.scoreBreakdown.delivery.score}/15</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{buyerMatch.scoreBreakdown.delivery.explanation}</p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Price Budget (10%)</span>
                              <span className="text-emerald-600 font-bold">{buyerMatch.scoreBreakdown.price.score}/10</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{buyerMatch.scoreBreakdown.price.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct Proposal Dialog Overlay */}
          {proposingBuyer && (
            <div className="mt-4 p-5 bg-emerald-50/90 border border-emerald-300 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Dispatch Commercial Offer to {proposingBuyer.buyerCompany}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setProposingBuyer(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSendProposalSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Offer Price (₹/kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={proposalPrice}
                      onChange={(e) => setProposalPrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Buyer ceiling: ₹{proposingBuyer.maxPricePerKg}/kg</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Offer Quantity (kg)
                    </label>
                    <input
                      type="number"
                      required
                      max={produce.available_qty_kg}
                      value={proposalQty}
                      onChange={(e) => setProposalQty(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Buyer requested: {Number(proposingBuyer.quantityKg).toLocaleString()} kg</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Estimated Deal Value
                    </label>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-black text-emerald-800 text-sm">
                      ₹{Math.round((parseFloat(proposalPrice) || 0) * (parseFloat(proposalQty) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Proposal Message / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="E.g., Ready for immediate dispatch, harvested fresh with 4-step quality verification passed."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProposingBuyer(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Confirm & Send Proposal</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All buyer requirements are verified with active GSTIN and procurement guarantees.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
