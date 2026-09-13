import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DigitalVerificationBadge } from '../../components/common/DigitalVerificationBadge';
import { ReciprocalRatingModal } from '../../components/common/ReciprocalRatingModal';
import { RazorpayPaymentReceiptModal } from '../../components/common/RazorpayPaymentReceiptModal';
import {
  ShoppingCart, Truck, ShieldCheck, CheckCircle2, Clock,
  ArrowRight, ExternalLink, Award, FileText, Check, Lock
} from 'lucide-react';

export const FarmerOrdersPage = ({ onNavigate }) => {
  const { farmer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [ratingOrder, setRatingOrder] = useState(null);

  // Razorpay Escrow Receipt State
  const [activeReceiptData, setActiveReceiptData] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Fulfillment & Partial Fulfillment Modal State (Phase E)
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillQty, setFulfillQty] = useState('');
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillError, setFulfillError] = useState('');

  const handleOpenFulfillModal = (order) => {
    const remaining = order.remaining_qty_kg !== undefined ? order.remaining_qty_kg : order.agreed_qty_kg;
    setFulfillQty(remaining > 0 ? remaining : order.agreed_qty_kg);
    setFulfillNotes('');
    setFulfillError('');
    setFulfillModalOpen(true);
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setFulfilling(true);
    setFulfillError('');

    try {
      const res = await api.fulfillOrder(selectedOrder.id, {
        fulfill_qty_kg: parseFloat(fulfillQty),
        notes: fulfillNotes
      });

      if (res.success) {
        await fetchOrders();
        const updatedDetail = await api.getOrderDetail(selectedOrder.id);
        setSelectedOrder(updatedDetail.order);
        setFulfillModalOpen(false);
      } else {
        setFulfillError(res.error || 'Fulfillment update failed.');
      }
    } catch (err) {
      setFulfillError(err.message || 'Over-fulfillment or invalid quantity.');
    } finally {
      setFulfilling(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const farmerId = farmer ? farmer.id : 'frm_1';
      const res = await api.getOrders({ farmerId });
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [farmer]);

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    setStatusUpdating(true);
    let nextStatus = 'Produce Preparing';
    if (currentStatus === 'Order Confirmed') nextStatus = 'Produce Preparing';
    else if (currentStatus === 'Produce Preparing') nextStatus = 'Ready for Pickup';
    else if (currentStatus === 'Ready for Pickup') nextStatus = 'Picked Up';
    else if (currentStatus === 'Picked Up') nextStatus = 'In Transit';
    else if (currentStatus === 'In Transit') nextStatus = 'Arrived at Destination';

    try {
      const res = await api.updateOrderStatus(orderId, nextStatus);
      if (res.success) {
        await fetchOrders();
        const updatedDetail = await api.getOrderDetail(orderId);
        setSelectedOrder(updatedDetail.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleVerifyPreDispatch = async (orderId) => {
    try {
      const res = await api.verifyOrderQuality(orderId);
      if (res.success) {
        fetchOrders();
        const updatedDetail = await api.getOrderDetail(orderId);
        setSelectedOrder(updatedDetail.order);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Commercial Orders & Fulfillment</h2>
          <p className="text-xs text-slate-500">
            Escrow-backed purchase contracts, pre-dispatch quality verification, and dispatch milestones
          </p>
        </div>

        <button
          onClick={() => onNavigate('farmer-delivery')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Launch GPS Fleet Tracking</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All Farm Fulfillment Orders:
          </div>

          {orders.map((ord) => {
            const isSelected = selectedOrder?.id === ord.id;
            return (
              <button
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`w-full text-left p-4 rounded-2xl border transition ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">{ord.order_code}</span>
                  <StatusBadge status={ord.status} size="xs" />
                </div>

                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-800">{ord.buyer_company}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {ord.crop_name} • {Number(ord.agreed_qty_kg).toLocaleString()} kg @ ₹{ord.agreed_price_per_kg}/kg
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total: ₹{(ord.total_value / 100000).toFixed(2)} Lakhs</span>
                  <span className="text-emerald-700 font-semibold">{ord.verification_id ? '✓ Verified ID' : 'Pre-Dispatch'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 2-Columns: Selected Order Detailed Manifest */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <>
              {/* Order Manifest Header Card (Section 23) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono text-slate-400">Order ID:</span>
                      <h3 className="font-mono font-black text-lg text-slate-900">{selectedOrder.order_code}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Created on {new Date(selectedOrder.created_at).toLocaleDateString()} • Escrow Secured
                    </p>
                  </div>

                  <StatusBadge status={selectedOrder.status} size="lg" />
                </div>

                {/* Section 23 Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Buyer Enterprise</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.buyer_company}</div>
                    <div className="text-[10px] text-slate-500">Trust Score: 95%</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Produce Lot</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.crop_name}</div>
                    <div className="text-[10px] text-slate-500">{selectedOrder.quality_grade || 'Grade A'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Agreed Quantity</span>
                    <div className="font-bold text-slate-900 mt-0.5">{Number(selectedOrder.agreed_qty_kg).toLocaleString()} kg</div>
                    <div className="text-[10px] text-slate-500">{(selectedOrder.agreed_qty_kg / 1000).toFixed(1)} Tonnes</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Contract Price</span>
                    <div className="font-bold text-emerald-800 text-sm mt-0.5">₹{selectedOrder.agreed_price_per_kg}/kg</div>
                    <div className="text-[10px] text-slate-500">Fixed Rate</div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 font-semibold text-[11px]">Total Contract Value</span>
                    <div className="font-black text-emerald-950 text-base mt-0.5">
                      ₹{Number(selectedOrder.total_value).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700">₹{(selectedOrder.total_value / 100000).toFixed(2)} Lakhs</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Expected Delivery</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.expected_delivery || 'Today, 5:30 PM'}</div>
                    <div className="text-[10px] text-slate-500">On-Time Logistics</div>
                  </div>
                </div>

                {/* Fulfillment & Partial Fulfillment Status (Phase E) */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800">Fulfillment Pipeline Tracking (Phase E):</span>
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
                      <span className="text-[10px] text-slate-400">Ordered</span>
                      <div className="font-black text-slate-800 text-sm">
                        {Number(selectedOrder.ordered_qty_kg || selectedOrder.agreed_qty_kg).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-400">Fulfilled</span>
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

                  {/* Razorpay Escrow Status Banner */}
                  {selectedOrder.payment_status === 'PAID' ? (
                    <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px]">
                          Buyer Paid via Razorpay: ₹{Number(selectedOrder.total_value).toLocaleString()} secured in RBI Escrow Account.
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenReceipt(selectedOrder)}
                        className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-850 font-bold text-xs shadow-2xs transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Official Escrow Receipt</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-emerald-200/80 flex items-center gap-1.5 text-slate-600">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">
                        Payment Term: {selectedOrder.payment_method === 'COD' ? 'Cash on Delivery upon Weighbridge Verification' : 'Pending Buyer Razorpay Settlement'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pickup & Delivery Locations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium text-[11px]">Pickup Location</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.pickup_location || 'Sanivarapupeta, Eluru'}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium text-[11px]">Delivery Facility</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.delivery_location || 'Morampudi Industrial Zone, Rajahmundry'}</div>
                  </div>
                </div>

                {/* Status Advancement Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Status: <strong>{selectedOrder.status}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrder.status !== 'Completed' && (
                      <button
                        onClick={() => handleOpenFulfillModal(selectedOrder)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatch / Fulfill Batch</span>
                      </button>
                    )}

                    {selectedOrder.status !== 'Completed' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedOrder.id, selectedOrder.status)}
                        disabled={statusUpdating}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                      >
                        {statusUpdating ? 'Updating...' : `Next Stage →`}
                      </button>
                    )}

                    {selectedOrder.status === 'Completed' && (
                      <button
                        onClick={() => setRatingOrder(selectedOrder)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Rate Buyer</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigate('farmer-delivery')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>GPS Route</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 24: Pre-Dispatch Verification Seal Component */}
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
              Select an order from the list to view commercial terms and digital verification.
            </div>
          )}
        </div>
      </div>

      {/* Reciprocal Rating Modal */}
      {ratingOrder && (
        <ReciprocalRatingModal
          order={ratingOrder}
          isOpen={true}
          currentRole="farmer"
          onClose={() => setRatingOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {/* Fulfillment & Partial Fulfillment Modal (Phase E) */}
      {fulfillModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Fulfill / Dispatch Batch</h3>
                <p className="text-[11px] text-slate-500">Order: {selectedOrder.order_code}</p>
              </div>
              <button
                onClick={() => setFulfillModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {fulfillError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {fulfillError}
              </div>
            )}

            <form onSubmit={handleFulfillSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Ordered:</span>
                  <span className="font-bold text-slate-900">
                    {Number(selectedOrder.ordered_qty_kg || selectedOrder.agreed_qty_kg).toLocaleString()} kg
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Fulfilled:</span>
                  <span className="font-bold text-emerald-700">
                    {Number(selectedOrder.fulfilled_qty_kg || 0).toLocaleString()} kg
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>Remaining to Fulfill:</span>
                  <span className="text-amber-700">
                    {Number(selectedOrder.remaining_qty_kg !== undefined ? selectedOrder.remaining_qty_kg : selectedOrder.agreed_qty_kg).toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity to Dispatch in this Batch (kg):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedOrder.remaining_qty_kg !== undefined ? selectedOrder.remaining_qty_kg : selectedOrder.agreed_qty_kg}
                  value={fulfillQty}
                  onChange={(e) => setFulfillQty(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-sm text-emerald-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter full remaining quantity for complete dispatch, or less for Partial Fulfillment.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dispatch Notes / Vehicle Batch Number:
                </label>
                <input
                  type="text"
                  value={fulfillNotes}
                  onChange={(e) => setFulfillNotes(e.target.value)}
                  placeholder="e.g. Batch 1 of 2 - AP 37 TE 1234"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fulfilling}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {fulfilling ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
