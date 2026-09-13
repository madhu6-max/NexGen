import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  MessageSquare, Handshake, Check, X, ArrowRight, ShieldCheck,
  Calendar, MapPin, Scale, DollarSign, Clock, Send
} from 'lucide-react';

export const BuyerRequestsPage = ({ onNavigate }) => {
  const { farmer } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Counter offer modal state
  const [activeNegotiation, setActiveNegotiation] = useState(null);
  const [counterPrice, setCounterPrice] = useState(31.0);
  const [counterNote, setCounterNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      const farmerId = farmer ? farmer.id : 'frm_1';
      const res = await api.getRequests({ farmerId });
      if (res.requests) {
        setRequests(res.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [farmer]);

  const handleOpenNegotiation = async (reqItem) => {
    try {
      const res = await api.getRequestDetail(reqItem.id);
      setActiveNegotiation(res);
      setCounterPrice(reqItem.counter_price_per_kg || reqItem.offered_price_per_kg + 1.0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFarmerAccept = async (reqId) => {
    setSubmitting(true);
    try {
      const res = await api.farmerAcceptRequest(reqId);
      if (res.success) {
        setActionSuccess('Terms accepted! Notified buyer for final confirmation.');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchRequests();
        if (activeNegotiation) {
          const detail = await api.getRequestDetail(reqId);
          setActiveNegotiation(detail);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFarmerReject = async (reqId) => {
    try {
      await api.farmerRejectRequest(reqId, { reason: 'Price below operational minimum.' });
      fetchRequests();
      setActiveNegotiation(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCounter = async (e) => {
    e.preventDefault();
    if (!activeNegotiation) return;
    setSubmitting(true);
    try {
      const res = await api.counterOffer(activeNegotiation.request.id, {
        counter_price_per_kg: parseFloat(counterPrice),
        sender_role: 'farmer',
        sender_name: farmer ? farmer.name : 'Farmer Ramesh',
        note: counterNote || `Counter offer: ₹${counterPrice}/kg (Grade-A hand sorted)`
      });

      if (res.success) {
        setActionSuccess(`Counter-offer of ₹${counterPrice}/kg dispatched to buyer!`);
        setTimeout(() => setActionSuccess(''), 4000);
        const detail = await api.getRequestDetail(activeNegotiation.request.id);
        setActiveNegotiation(detail);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Buyer Purchase Requests</h2>
          <p className="text-xs text-slate-500">
            Institutional purchase inquiries, match scores, and direct bilateral price negotiation
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Primary Highlighted Request: Section 13 ABC Food Processing */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
            No incoming buyer requests at this moment.
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center font-bold text-lg">
                    🏢
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{r.buyer_company}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        95% Match Score
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Procurement Lead • Verified Institutional Buyer (Trust: {r.buyer_trust || 95}%)
                    </p>
                  </div>
                </div>

                <StatusBadge status={r.status} size="lg" />
              </div>

              {/* Section 13 Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Produce</div>
                  <div className="font-bold text-slate-900 mt-0.5">{r.crop_name} ({r.quality_grade})</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Quantity Requested</div>
                  <div className="font-bold text-slate-900 mt-0.5">{Number(r.requested_qty_kg).toLocaleString()} kg</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Offered Price</div>
                  <div className="font-bold text-emerald-800 text-sm mt-0.5">
                    ₹{r.counter_price_per_kg || r.offered_price_per_kg}/kg
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Delivery Deadline</div>
                  <div className="font-bold text-slate-900 mt-0.5">{r.delivery_date || 'Sept 15'}</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Haul Distance</div>
                  <div className="font-bold text-slate-900 mt-0.5">12 km (Eluru Hub)</div>
                </div>
              </div>

              {/* Actions Row (Section 13: [Accept] [Reject] [Counter Offer]) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 font-mono">
                  Current Status: <strong className="text-slate-700">{r.status}</strong>
                  {r.counter_price_per_kg && ` (Counter: ₹${r.counter_price_per_kg}/kg)`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFarmerReject(r.id)}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleOpenNegotiation(r)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Negotiation & Counter Offer</span>
                  </button>

                  <button
                    onClick={() => handleFarmerAccept(r.id)}
                    disabled={r.status === 'Accepted_By_Farmer' || r.status === 'Confirmed_By_Buyer'}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{r.status === 'Accepted_By_Farmer' ? 'Accepted by You' : 'Accept Terms'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Negotiation Interface Modal (Section 14) */}
      {activeNegotiation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Bilateral Negotiation (Section 14)
                </h3>
              </div>
              <button
                onClick={() => setActiveNegotiation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Terms Summary */}
            <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Quantity</div>
                <div className="font-bold text-slate-900">{Number(activeNegotiation.request.requested_qty_kg).toLocaleString()} kg</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Offered Price</div>
                <div className="font-bold text-slate-900">₹{activeNegotiation.request.offered_price_per_kg}/kg</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Delivery Date</div>
                <div className="font-bold text-slate-900">{activeNegotiation.request.delivery_date}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Quality</div>
                <div className="font-bold text-slate-900">{activeNegotiation.request.quality_grade || 'Grade A'}</div>
              </div>
            </div>

            {/* Negotiation Conversation Thread */}
            <div className="space-y-3 max-h-56 overflow-y-auto p-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Price Negotiation Timeline:
              </div>

              {activeNegotiation.negotiationHistory?.map((h, i) => (
                <div
                  key={h.id || i}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    h.sender_role === 'farmer'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 ml-6'
                      : 'bg-blue-50 border border-blue-200 text-blue-950 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{h.sender_name || (h.sender_role === 'farmer' ? 'Farmer Ramesh' : 'Buyer (ABC Foods)')}</span>
                    <span className="font-mono text-sm font-black">₹{h.price_per_kg}/kg</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{h.note}</p>
                </div>
              ))}
            </div>

            {/* Counter Offer Input */}
            <form onSubmit={handleSendCounter} className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="w-36">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Counter (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full text-base font-black p-2.5 border-2 border-emerald-500 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Optional Note to Buyer
                  </label>
                  <input
                    type="text"
                    value={counterNote}
                    onChange={(e) => setCounterNote(e.target.value)}
                    placeholder="e.g. ₹31/kg includes crate sorting & immediate loading"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleFarmerAccept(activeNegotiation.request.id)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  Accept Current Terms
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{submitting ? 'Sending...' : 'Dispatch Counter Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
