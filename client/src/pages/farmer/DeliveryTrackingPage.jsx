import React from 'react';
import { GpsDeliveryMap } from '../../components/maps/GpsDeliveryMap';
import { Truck, ArrowLeft, ShieldCheck } from 'lucide-react';

export const DeliveryTrackingPage = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Fleet Logistics Telematics
            </span>
            <span className="text-xs font-mono text-slate-500">Order: AGRI-2026-001024</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            GPS Fleet Tracking & Dispatch Control (Section 25 & 26)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time highway transit monitoring from farm gate (Eluru) to buyer processing plant (Rajahmundry)
          </p>
        </div>

        <button
          onClick={() => onNavigate('farmer-orders')}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </button>
      </div>

      {/* Embedded Telematics Canvas */}
      <GpsDeliveryMap orderId="ord_active_1" />
    </div>
  );
};
