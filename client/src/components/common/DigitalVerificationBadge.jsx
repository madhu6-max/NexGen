import React from 'react';
import { ShieldCheck, CheckCircle2, QrCode, FileText } from 'lucide-react';

export const DigitalVerificationBadge = ({
  verificationId = 'VER-AGRI-928374',
  quantity = '8,000 kg',
  quality = 'Grade A',
  price = '₹31/kg',
  verifiedAt = '2026-09-09',
  compact = false
}) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Verification ID: <code className="font-mono text-emerald-950 font-bold">{verificationId}</code></span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span className="text-emerald-700">Digital Seal Verified</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/30 relative overflow-hidden">
      {/* Subtle security watermark pattern */}
      <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
        <ShieldCheck className="w-48 h-48 text-emerald-300" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-700/50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300">AgriLink B2B Escrow Protocol</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-emerald-950 uppercase">Pre-Dispatch Certified</span>
            </div>
            <h4 className="text-lg font-bold text-white tracking-tight">Digital Order Verification</h4>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-emerald-300/80 uppercase font-mono">Verification ID</div>
          <div className="font-mono text-xl font-extrabold tracking-wider text-emerald-200">
            {verificationId}
          </div>
        </div>
      </div>

      {/* 3 Pillars of Pre-Dispatch Verification */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="bg-emerald-950/60 border border-emerald-700/40 rounded-xl p-3">
          <div className="text-xs text-emerald-300 font-medium">Quantity Declared</div>
          <div className="text-base font-bold text-white mt-0.5">{quantity}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Weighbridge Confirmed</span>
          </div>
        </div>

        <div className="bg-emerald-950/60 border border-emerald-700/40 rounded-xl p-3">
          <div className="text-xs text-emerald-300 font-medium">Quality Inspection</div>
          <div className="text-base font-bold text-white mt-0.5">{quality}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Grading Certificate Matched</span>
          </div>
        </div>

        <div className="bg-emerald-950/60 border border-emerald-700/40 rounded-xl p-3">
          <div className="text-xs text-emerald-300 font-medium">Contract Price</div>
          <div className="text-base font-bold text-white mt-0.5">{price}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Escrow Locked</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-emerald-200/80 pt-2 border-t border-emerald-800/40">
        <div className="flex items-center gap-2 font-mono">
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Hash: SHA256_{verificationId.replace('VER-AGRI-', '')}_FARM_ESCROW_VALID</span>
        </div>
        <div>
          Certified on {new Date(verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};
