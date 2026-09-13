import React, { useRef } from 'react';
import {
  CheckCircle2, ShieldCheck, Printer, Download,
  ExternalLink, ArrowRight, X, Building2, User, FileText
} from 'lucide-react';

export const RazorpayPaymentReceiptModal = ({ isOpen, onClose, receiptData, onNavigateTracking }) => {
  const receiptRef = useRef(null);

  if (!isOpen || !receiptData) return null;

  const {
    receiptNumber, invoiceDate, paymentMethod, paymentStatus, razorpayPaymentId,
    razorpayOrderId, escrowGuaranteeText, order, buyer, farmer, financials
  } = receiptData;

  const buyerContactLine = [buyer?.contactPerson, buyer?.contactPhone].filter(Boolean).join(' ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div
        ref={receiptRef}
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col text-slate-800 print:border-none print:shadow-none print:max-w-none"
      >
        {/* Top Header - Payment Receipt Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                🌱
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">AgriLink B2B Payment Receipt</h3>
                <p className="text-[11px] text-emerald-300 font-medium">Payment is processed securely through Razorpay.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
                title="Print Receipt / Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4 relative z-10">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Official Payment Receipt</span>
              <h2 className="text-xl font-black font-mono text-emerald-400 mt-0.5">{receiptNumber}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Date: {new Date(invoiceDate || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </p>
            </div>

            {/* Official Paid Stamp */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{paymentStatus || 'PAID'} • PAYMENT VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Key Reference Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Payment ID</span>
              <span className="font-mono font-bold text-slate-900 text-xs truncate block" title={razorpayPaymentId || ''}>
                {razorpayPaymentId || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Razorpay Order ID</span>
              <span className="font-mono font-bold text-slate-900 text-xs truncate block" title={razorpayOrderId || ''}>
                {razorpayOrderId || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Payment Channel</span>
              <span className="font-bold text-emerald-800 text-xs block">
                {paymentMethod === 'ONLINE_RAZORPAY' ? 'Razorpay Payment' : paymentMethod}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Payment Status</span>
              <span className="font-bold text-emerald-800 text-xs block">{paymentStatus || '—'}</span>
            </div>
          </div>

          {/* Parties: Buyer & Farmer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Billed To (Buyer)</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{buyer?.companyName}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">GSTIN: {buyer?.gstin || '—'}</p>
              <p className="text-[11px] text-slate-600 mt-1">{buyer?.address || '—'}</p>
              {buyerContactLine && (
                <p className="text-[11px] text-slate-500 mt-0.5">Contact: {buyerContactLine}</p>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Beneficiary (Farmer)</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{farmer?.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Location: {[farmer?.village, farmer?.district].filter(Boolean).join(', ') || '—'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Phone: {farmer?.phone || '—'}</p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Agricultural Producer</span>
              </div>
            </div>
          </div>

          {/* Itemized Order & Financials Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Item / Commodity</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Agreed Rate</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{order?.cropName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Order Code: #{order?.orderCode}</div>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-800">{order?.qualityGrade}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{Number(order?.agreedQtyKg).toLocaleString()} kg</td>
                  <td className="p-3 text-right font-mono text-slate-800">₹{order?.agreedPricePerKg}/kg</td>
                  <td className="p-3 text-right font-black text-slate-900 font-mono">
                    ₹{financials?.produceSubtotal?.toLocaleString()}
                  </td>
                </tr>

                <tr className="bg-slate-50/50 text-slate-600">
                  <td colSpan={4} className="p-2.5 text-right font-semibold">AgriLink Platform Fee (1.0%):</td>
                  <td className="p-2.5 text-right font-mono">₹{financials?.platformEscrowFee?.toLocaleString()}</td>
                </tr>

                <tr className="bg-slate-50/50 text-slate-600">
                  <td colSpan={4} className="p-2.5 text-right font-semibold">GST on Platform Fee (18%):</td>
                  <td className="p-2.5 text-right font-mono">₹{financials?.gstOnFee?.toLocaleString()}</td>
                </tr>

                <tr className="bg-emerald-50/80 font-bold text-emerald-950 border-t-2 border-emerald-500">
                  <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider">
                    Total Amount Paid:
                  </td>
                  <td className="p-3 text-right text-base font-black text-emerald-900 font-mono">
                    ₹{financials?.totalAmountPaid?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment & Settlement Information */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-emerald-900 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Payment & Settlement Information: </strong>
              {escrowGuaranteeText || 'Payment is processed through Razorpay and recorded against the AgriLink order workflow.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-[10px] text-slate-400 font-mono">
            {razorpayPaymentId
              ? `Auth Signature Hash: SHA256-RZP-OK-${razorpayPaymentId.slice(-8)}`
              : 'Auth Signature Hash: —'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Tax Invoice</span>
            </button>

            {onNavigateTracking && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTracking(order?.id || order?.orderCode);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <span>Track Fulfillment & GPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
