import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  RotateCcw, AlertTriangle, Upload, CheckCircle2, ShieldAlert,
  FileText, ArrowRight, Camera, Check
} from 'lucide-react';

export const BuyerReturnsPage = ({ initialOrderId, onNavigate }) => {
  const { organization } = useAuth();
  const [returnsList, setReturnsList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // File new issue form
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId || '');
  const [reason, setReason] = useState('Damaged Produce');
  const [description, setDescription] = useState('');
  const [disputedQty, setDisputedQty] = useState(300);
  const [evidenceImage, setEvidenceImage] = useState('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80');
  const [submitting, setSubmitting] = useState(false);
  const [filedSuccess, setFiledSuccess] = useState(null);

  const fetchReturnsAndOrders = async () => {
    try {
      const buyerId = organization ? organization.id : 'org_1';
      const [rRes, oRes] = await Promise.all([
        api.getReturns({ buyerId }),
        api.getOrders({ buyerId })
      ]);

      if (rRes.returns) setReturnsList(rRes.returns);
      if (oRes.orders) {
        setOrders(oRes.orders);
        if (!selectedOrderId && oRes.orders.length > 0) {
          setSelectedOrderId(oRes.orders[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsAndOrders();
  }, [organization, initialOrderId]);

  const handleFileReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        order_id: selectedOrderId,
        reason,
        description: description || 'Batch transit damage observed during crate unloading. Requesting replacement credit.',
        requested_qty_kg: parseFloat(disputedQty),
        evidence_images: evidenceImage
      };

      const res = await api.reportReturnIssue(payload);
      if (res.success) {
        setFiledSuccess(res.returnCase);
        setDescription('');
        fetchReturnsAndOrders();
      }
    } catch (err) {
      console.error('Failed to report issue:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Return & Replacement System (Section 29 & 30)</h2>
        <p className="text-xs text-slate-500">
          File claims for damaged consignments, upload photographic evidence, and obtain impartial arbitration
        </p>
      </div>

      {filedSuccess && (
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl shadow-md space-y-1 animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dispute Claim Successfully Logged</span>
          </div>
          <h4 className="text-lg font-black font-mono">Return Case ID: {filedSuccess.return_code}</h4>
          <p className="text-xs text-emerald-100">
            Escrow payment for disputed {filedSuccess.requested_qty_kg} kg placed on administrative hold pending arbitration.
          </p>
        </div>
      )}

      {/* Two Column Grid: File Issue Form + Existing Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File a New Claim (Section 29) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              File Sourcing Dispute (Section 29)
            </h3>
          </div>

          <form onSubmit={handleFileReturn} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Disputed Order</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-mono"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_code} - {o.crop_name} ({Number(o.agreed_qty_kg).toLocaleString()} kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Section 29 Disputed Reasons */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Claim (Section 29)</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="Wrong Quantity">Wrong Quantity</option>
                <option value="Poor Quality">Poor Quality</option>
                <option value="Damaged Produce">Damaged Produce</option>
                <option value="Wrong Product">Wrong Product</option>
                <option value="Late Delivery">Late Delivery</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Affected Quantity (kg)</label>
              <input
                type="number"
                step="50"
                required
                value={disputedQty}
                onChange={(e) => setDisputedQty(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Defect Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe specific crate issues, transit bruising, moisture deviations..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Photo / Inspection Evidence</label>
              <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50 space-y-1">
                <Camera className="w-5 h-5 text-slate-400 mx-auto" />
                <span className="text-[11px] text-slate-500 block">Weighbridge & Crate Photos Attached</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Filing Claim...' : 'Submit Claim for Verification'}
            </button>
          </form>
        </div>

        {/* Right 2-Columns: Return Case Verification Docket (Section 30) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Return & Dispute Cases (Section 30 Docket):
          </div>

          {returnsList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
              No dispute cases on file. All orders fulfilled according to technical specifications.
            </div>
          ) : (
            returnsList.map((ret) => (
              <div
                key={ret.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{ret.return_code}</span>
                      <span className="text-xs text-slate-400 font-mono">Original: {ret.order_code}</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-1">Supplier: {ret.farmer_name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={ret.admin_decision || 'Pending Review'} size="xs" />
                    <StatusBadge status={ret.resolution_status} size="xs" />
                  </div>
                </div>

                {/* Section 30 Docket Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                    <span className="text-rose-800 font-semibold text-[11px]">Reason for Return</span>
                    <div className="font-bold text-rose-950 mt-0.5">{ret.reason}</div>
                    <p className="text-[11px] text-rose-800/90 mt-1 leading-relaxed">{ret.description}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-medium text-[11px]">Disputed Lot Volume</span>
                    <div className="font-bold text-slate-900 mt-0.5">{ret.requested_qty_kg} kg</div>
                    <div className="text-[10px] text-slate-500 mt-1">Original batch: {Number(ret.agreed_qty_kg).toLocaleString()} kg</div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 font-semibold text-[11px]">Arbitration Resolution</span>
                    <div className="font-bold text-emerald-950 mt-0.5">{ret.admin_decision}</div>
                    <div className="text-[10px] text-emerald-700 mt-1 font-medium">{ret.resolution_status}</div>
                  </div>
                </div>

                {ret.farmer_response && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700">Farmer Supplier Statement: </span>
                    <span className="text-slate-600">{ret.farmer_response}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
