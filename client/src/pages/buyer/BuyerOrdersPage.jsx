import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DigitalVerificationBadge } from '../../components/common/DigitalVerificationBadge';
import { ReciprocalRatingModal } from '../../components/common/ReciprocalRatingModal';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import { RazorpayPaymentReceiptModal } from '../../components/common/RazorpayPaymentReceiptModal';
import {
  ShoppingCart, Truck, ShieldCheck, CheckCircle2, AlertTriangle,
  RotateCcw, Star, ArrowRight, Eye, Check, X, CreditCard, FileText, Lock
} from 'lucide-react';

export const BuyerOrdersPage = ({ onNavigate }) => {
  const { organization } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Razorpay Payment Modal State
  const [payModalOrder, setPayModalOrder] = useState(null);
  const [activeReceiptData, setActiveReceiptData] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Delivery Inspection Modal State (Section 28)
  const [inspectionModalOrder, setInspectionModalOrder] = useState(null);
  const [receivedQty, setReceivedQty] = useState(8000);
  const [condition, setCondition] = useState('Good');
  const [inspectionNotes, setInspectionNotes] = useState('All 8,000 kg checked at facility weighbridge. Brix 4.8 verified.');
  const [submittingInspection, setSubmittingInspection] = useState(false);

  // Reciprocal Rating Modal (Section 31)
  const [ratingOrder, setRatingOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const buyerId = organization ? organization.id : 'org_1';
      const res = await api.getOrders({ buyerId });
      if (res.orders) {
        setOrders(res.orders);
        if (res.orders.length > 0 && !selectedOrder) {
          setSelectedOrder(res.orders[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (order) => {
    try {
      const rcpt = await api.getPaymentReceipt(order.id);
      if (rcpt && rcpt.success) {
        setActiveReceiptData(rcpt);
        setReceiptModalOpen(true);
      } else {
        alert('Could not retrieve digital receipt.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching receipt: ' + err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [organization]);

  const handleDeliveryAction = async (action) => {
    if (!inspectionModalOrder) return;
    setSubmittingInspection(true);
    try {
      if (action === 'accept') {
        const res = await api.confirmDeliveryInspection(inspectionModalOrder.id, {
          action: 'accept',
          qty_received_kg: parseFloat(receivedQty),
          condition_status: condition,
          inspector_notes: inspectionNotes
        });

        if (res.success) {
          await fetchOrders();
          const target = inspectionModalOrder;
          setInspectionModalOrder(null);
          // Open reciprocal rating modal right after accepting delivery (Section 31)
          setRatingOrder(target);
        }
      } else {
        // Report Issue -> Redirect to Return & Replacement filing (Section 29)
        setInspectionModalOrder(null);
        onNavigate('buyer-returns', { orderId: inspectionModalOrder.id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInspection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Procurement Orders & Inspection (Section 23 & 28)</h2>
          <p className="text-xs text-slate-500">
            Monitor active shipments, verify pre-dispatch codes, and conduct weighbridge delivery acceptance
          </p>
        </div>

        <button
          onClick={() => onNavigate('farmer-delivery')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Live GPS Fleet Tracking</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All Corporate Orders:
          </div>

          {orders.map((ord) => {
            const isSelected = selectedOrder?.id === ord.id;
            return (
              <button
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`w-full text-left p-4 rounded-2xl border transition ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">{ord.order_code}</span>
                  <StatusBadge status={ord.status} size="xs" />
                </div>

                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-800">{ord.farmer_name} (Supplier)</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {ord.crop_name} • {Number(ord.agreed_qty_kg).toLocaleString()} kg @ ₹{ord.agreed_price_per_kg}/kg
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">₹{(ord.total_value / 100000).toFixed(2)} Lakhs</span>
                  <span className="text-emerald-700 font-semibold">{ord.verification_id || 'VER-AGRI-928374'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 2-Columns: Order Details & Inspection Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <>
              {/* Order Manifest (Section 23) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono text-slate-400">Order ID:</span>
                      <h3 className="font-mono font-black text-lg text-slate-900">{selectedOrder.order_code}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supplier: <strong>{selectedOrder.farmer_name}</strong> • Eluru Agro Cluster
                    </p>
                  </div>

                  <StatusBadge status={selectedOrder.status} size="lg" />
                </div>

                {/* Section 23 Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Crop & Quality</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.crop_name}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">{selectedOrder.quality_grade}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Agreed Quantity</span>
                    <div className="font-bold text-slate-900 mt-0.5">{Number(selectedOrder.agreed_qty_kg).toLocaleString()} kg</div>
                    <div className="text-[10px] text-slate-500">{(selectedOrder.agreed_qty_kg / 1000).toFixed(1)} Tonnes</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Contract Price</span>
                    <div className="font-bold text-emerald-800 text-sm mt-0.5">₹{selectedOrder.agreed_price_per_kg}/kg</div>
                    <div className="text-[10px] text-slate-500">Locked in Escrow</div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 font-semibold text-[11px]">Total Contract Value</span>
                    <div className="font-black text-emerald-950 text-base mt-0.5">
                      ₹{Number(selectedOrder.total_value).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700">₹{(selectedOrder.total_value / 100000).toFixed(2)} Lakhs</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Pickup Origin</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.pickup_location || 'Sanivarapupeta, Eluru'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Destination Facility</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.delivery_location || 'Eluru Processing Facility'}</div>
                  </div>
                </div>

                {/* Payment & Fulfillment Pipeline Tracker */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800">Commercial Settlement & Fulfillment Tracking:</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        selectedOrder.payment_status === 'PAID'
                          ? 'bg-emerald-200 text-emerald-950'
                          : selectedOrder.payment_status === 'COD_PENDING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : selectedOrder.payment_status === 'COD_COLLECTED'
                          ? 'bg-teal-100 text-teal-900 border border-teal-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        Payment: {selectedOrder.payment_status || 'NOT_REQUIRED_YET'}
                      </span>
                      <span className="font-mono font-bold text-emerald-800 text-[11px]">
                        Method: {selectedOrder.payment_method || 'COD'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-400">Total Ordered</span>
                      <div className="font-black text-slate-800 text-sm">
                        {Number(selectedOrder.ordered_qty_kg || selectedOrder.agreed_qty_kg).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-400">Fulfilled to Date</span>
                      <div className="font-black text-emerald-700 text-sm">
                        {Number(selectedOrder.fulfilled_qty_kg || 0).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-400">Remaining</span>
                      <div className="font-black text-amber-700 text-sm">
                        {Number(selectedOrder.remaining_qty_kg !== undefined ? selectedOrder.remaining_qty_kg : selectedOrder.agreed_qty_kg).toLocaleString()} kg
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Transaction Action Bar */}
                  {selectedOrder.payment_status !== 'PAID' ? (
                    <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-semibold">Payment pending: Secure funds in RBI-compliant Escrow.</span>
                      </div>
                      <button
                        onClick={() => setPayModalOrder(selectedOrder)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay ₹{Number(selectedOrder.total_value).toLocaleString()} via Razorpay Escrow</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px]">Payment Verified & Funds Secured in AgriLink RBI Escrow.</span>
                      </div>
                      <button
                        onClick={() => handleOpenReceipt(selectedOrder)}
                        className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-2xs transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Razorpay Tax Invoice & Receipt</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 28 Buyer Inspection Action Bar */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-400">
                      Section 28 Delivery Inspection Gateway
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Inspect weighbridge intake, fruit firmness, and condition before releasing payment.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('farmer-delivery')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                    >
                      View GPS Telematics
                    </button>

                    <button
                      onClick={() => {
                        setInspectionModalOrder(selectedOrder);
                        setReceivedQty(selectedOrder.agreed_qty_kg);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Inspect Consignment (Section 28)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 24 Digital Pre-Dispatch Verification Seal */}
              <DigitalVerificationBadge
                verificationId={selectedOrder.verification_id || 'VER-AGRI-928374'}
                quantity={`${Number(selectedOrder.agreed_qty_kg).toLocaleString()} kg`}
                quality={selectedOrder.quality_grade || 'Grade A'}
                price={`₹${selectedOrder.agreed_price_per_kg}/kg`}
                verifiedAt={selectedOrder.created_at}
              />
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
              Select an order from the list.
            </div>
          )}
        </div>
      </div>

      {/* Section 28: Buyer Delivery Confirmation Modal */}
      {inspectionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-mono text-emerald-700 font-bold">Section 28 Protocol</span>
                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                  Buyer Delivery Confirmation ({inspectionModalOrder.order_code})
                </h3>
              </div>
              <button
                onClick={() => setInspectionModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 28 Manifest Check */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Received at Weighbridge (kg)
                </label>
                <input
                  type="number"
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observed Produce Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white font-semibold focus:outline-none"
                >
                  <option value="Good">Good (Meets Contract Specifications)</option>
                  <option value="Fair">Fair (Minor Mechanical Bruising)</option>
                  <option value="Poor">Poor (High Moisture / Mold Risk)</option>
                  <option value="Damaged">Damaged / Crate Compression</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quality & Lab Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Primary Action Buttons (Section 28: [ Accept Delivery ] [ Report Issue ]) */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeliveryAction('report_issue')}
                disabled={submittingInspection}
                className="py-3 px-4 rounded-xl border-2 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Report Issue (Section 29)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeliveryAction('accept')}
                disabled={submittingInspection}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Delivery (Section 28)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reciprocal Rating Modal (Section 31) */}
      {ratingOrder && (
        <ReciprocalRatingModal
          order={ratingOrder}
          isOpen={true}
          currentRole="buyer"
          onClose={() => setRatingOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {/* Razorpay Online Checkout Modal */}
      {payModalOrder && (
        <CheckoutModal
          isOpen={true}
          order={payModalOrder}
          onClose={() => setPayModalOrder(null)}
          onSuccess={(updatedOrder) => {
            fetchOrders();
            if (updatedOrder) setSelectedOrder(updatedOrder);
          }}
        />
      )}

      {/* Official Razorpay Tax Invoice & Escrow Receipt Modal */}
      {receiptModalOpen && activeReceiptData && (
        <RazorpayPaymentReceiptModal
          isOpen={receiptModalOpen}
          receiptData={activeReceiptData}
          onClose={() => {
            setReceiptModalOpen(false);
            setActiveReceiptData(null);
          }}
          onNavigateTracking={() => {
            setReceiptModalOpen(false);
            onNavigate('farmer-delivery');
          }}
        />
      )}
    </div>
  );
};
