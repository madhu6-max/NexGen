import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import {
  Handshake, CheckCircle2, ArrowRight, ShieldCheck,
  Scale, DollarSign, Calendar, MapPin, Send, AlertCircle, Sparkles,
  Clock, CreditCard, Lock
} from 'lucide-react';

export const BuyerNegotiationsPage = ({ onNavigate }) => {
  const { organization } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckoutRequest, setSelectedCheckoutRequest] = useState(null);
  const [confirmedSuccess, setConfirmedSuccess] = useState(null);

  const fetchRequests = async () => {
    try {
      const buyerId = organization ? organization.id : 'org_1';
      const res = await api.getRequests({ buyerId });
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
  }, [organization]);

  const handleCheckoutSuccess = (order) => {
    setConfirmedSuccess({
      orderCode: order.order_code,
      verificationId: order.verification_id,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method
    });
    fetchRequests();
    setTimeout(() => {
      onNavigate('buyer-orders', { orderId: order.id });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Purchase Requests & Negotiations (Section 22)</h2>
        <p className="text-xs text-slate-500">
          Review counter-offers, approve final commercial terms, and issue binding digital purchase orders
        </p>
      </div>

      {confirmedSuccess && (
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl shadow-lg animate-in zoom-in-95 duration-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>Order Confirmed & Created! (Section 22 Completed)</span>
          </div>
          <h3 className="text-xl font-black text-white">
            Order Code: <code className="font-mono text-emerald-200">{confirmedSuccess.orderCode}</code>
          </h3>
          <p className="text-xs text-emerald-100">
            Digital Pre-Dispatch Verification ID: <strong>{confirmedSuccess.verificationId}</strong>. Redirecting to procurement order tracking...
          </p>
        </div>
      )}

      {/* Section 22 Workflow Steps Indicator */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
        <div className="font-bold text-slate-700 mb-2">Section 22 Commercial Order Protocol:</div>
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="font-semibold text-emerald-800">1. Purchase Request Dispatched</span>
          <span>→</span>
          <span className="font-semibold text-emerald-800">2. Farmer Counter-Offer</span>
          <span>→</span>
          <span className="font-semibold text-blue-800">3. Buyer Reviews Final Terms</span>
          <span>→</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
            4. Buyer Explicit Confirmation
          </span>
          <span>→</span>
          <span className="font-bold text-emerald-700">5. Order Created & Escrow Locked</span>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
            No active purchase requests under negotiation.
          </div>
        ) : (
          requests.map((r) => {
            const finalPrice = r.counter_price_per_kg || r.offered_price_per_kg;
            const totalCost = r.requested_qty_kg * finalPrice;
            const canConfirm = r.status === 'Counter_Offered' || r.status === 'Accepted_By_Farmer' || r.status === 'Pending';

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                      👨‍🌾
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">{r.farmer_name}</h3>
                        <span className="text-xs text-slate-500 font-medium">({r.crop_name} • {r.quality_grade})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Farmer Reliability: <strong>{r.farmer_reliability || 92}%</strong> • Eluru Cluster
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={r.status} size="lg" />
                </div>

                {/* Terms Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Batch Quantity</span>
                    <div className="font-bold text-slate-900 mt-0.5">{Number(r.requested_qty_kg).toLocaleString()} kg</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Agreed Price</span>
                    <div className="font-black text-emerald-800 text-sm mt-0.5">₹{finalPrice}/kg</div>
                    {r.counter_price_per_kg && (
                      <span className="text-[10px] text-amber-700 font-semibold">Farmer counter: ₹{r.counter_price_per_kg}/kg</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Total Contract Escrow</span>
                    <div className="font-bold text-slate-900 mt-0.5">₹{totalCost.toLocaleString()}</div>
                    <span className="text-[10px] text-slate-500">₹{(totalCost / 100000).toFixed(2)} Lakhs</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Delivery Expected</span>
                    <div className="font-bold text-slate-900 mt-0.5">{r.delivery_date || 'Sept 15'}</div>
                  </div>
                </div>

                {/* Farmer Counter Note if present */}
                {r.note && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2">
                    <Handshake className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Farmer Note: </span>
                      <span>{r.note}</span>
                    </div>
                  </div>
                )}

                {/* Phase B: Mandatory Seller Acceptance Check & Checkout Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {r.status === 'Accepted_By_Farmer' && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Seller accepted terms. Checkout is unlocked.
                      </span>
                    )}
                    {r.status === 'Pending' && (
                      <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Awaiting seller acceptance before checkout is permitted.
                      </span>
                    )}
                    {r.status === 'Counter_Offered' && (
                      <span className="text-blue-700 font-semibold flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-blue-600" />
                        Counter-offer submitted. Seller must accept final terms.
                      </span>
                    )}
                    {r.status === 'Confirmed_By_Buyer' && (
                      <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Commercial order confirmed & created.
                      </span>
                    )}
                  </div>

                  {/* Actions according to state */}
                  {r.status === 'Accepted_By_Farmer' && (
                    <button
                      onClick={() => setSelectedCheckoutRequest(r)}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 transform active:scale-95"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-200" />
                      <span>Proceed to Checkout (COD / Razorpay)</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </button>
                  )}

                  {r.status === 'Pending' && (
                    <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Payment Locked (Requires Seller Acceptance)</span>
                    </div>
                  )}

                  {r.status === 'Confirmed_By_Buyer' && (
                    <button
                      onClick={() => onNavigate('buyer-orders')}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Checkout Modal (Phase B & C) */}
      <CheckoutModal
        isOpen={!!selectedCheckoutRequest}
        request={selectedCheckoutRequest}
        onClose={() => setSelectedCheckoutRequest(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};
