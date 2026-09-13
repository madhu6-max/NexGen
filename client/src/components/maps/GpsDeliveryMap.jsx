import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import {
  Truck, Navigation, Clock, MapPin, Phone, CheckCircle2,
  Circle, AlertCircle, Play, RotateCcw, ArrowRight, ShieldCheck
} from 'lucide-react';

export const GpsDeliveryMap = ({ orderId = 'ord_active_1', onStatusChange }) => {
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);

  const fetchDelivery = async () => {
    try {
      const res = await api.getDelivery(orderId);
      if (res.success) {
        setDeliveryData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [orderId]);

  const handleAdvanceStep = async () => {
    if (!deliveryData || !deliveryData.delivery) return;
    setStepping(true);
    try {
      const res = await api.stepDeliveryRoute(deliveryData.delivery.id);
      if (res.success) {
        await fetchDelivery();
        if (onStatusChange) onStatusChange(res.delivery.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStepping(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center animate-pulse">
        <Truck className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-bounce" />
        <p className="text-sm font-semibold text-slate-700">Connecting to AgriLink GPS Telematics Hub...</p>
      </div>
    );
  }

  const delivery = deliveryData?.delivery || {
    driver_name: 'Ravi Kumar',
    driver_phone: '+91 98492 88472',
    vehicle_number: 'AP 37 TE 1234',
    pickup_location: 'Sanivarapupeta, Eluru',
    delivery_location: 'Delta Agro Foods, Morampudi, Rajahmundry',
    distance_km: 65.0,
    distance_remaining_km: 24.5,
    estimated_arrival: 'Today, 5:30 PM',
    status: 'In Transit',
    progress_pct: 62
  };

  const waypoints = deliveryData?.routeWaypoints || [];
  const progress = delivery.progress_pct || 62;

  // Timeline steps for Section 27
  const timelineStages = [
    { name: 'Order Confirmed', completed: true },
    { name: 'Produce Preparing', completed: true },
    { name: 'Ready for Pickup', completed: true },
    { name: 'Picked Up', completed: progress >= 10 },
    { name: 'In Transit', current: progress >= 10 && progress < 100, completed: progress >= 100 },
    { name: 'Arrived at Destination', completed: progress >= 100 },
    { name: 'Buyer Inspection', completed: false },
    { name: 'Completed', completed: false }
  ];

  return (
    <div className="space-y-6">
      {/* Demo GPS Notice Pill (Section 26 Requirement) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <Navigation className="w-4 h-4 text-amber-600 flex-shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
          <span><strong>Demo GPS tracking</strong>: Simulated telematics along National Highway 16 (Eluru to Rajahmundry, Andhra Pradesh).</span>
        </div>
        <button
          onClick={handleAdvanceStep}
          disabled={stepping}
          className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
        >
          <Play className="w-3 h-3" />
          <span>{stepping ? 'Updating GPS...' : 'Advance Truck Position (Simulation)'}</span>
        </button>
      </div>

      {/* Main Grid: Telematics Card + Interactive Route Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logistics Manifest Sidebar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Consignment Telematics
            </h4>
            <StatusBadge status={delivery.status} />
          </div>

          {/* Vehicle and Driver */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Vehicle Assigned:</span>
              <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900 font-bold">
                {delivery.vehicle_number}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Assigned Driver:</span>
              <span className="font-semibold text-slate-900">{delivery.driver_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Contact:</span>
              <a href={`tel:${delivery.driver_phone}`} className="text-emerald-700 font-medium flex items-center gap-1 hover:underline">
                <Phone className="w-3 h-3" />
                <span>{delivery.driver_phone}</span>
              </a>
            </div>
          </div>

          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-[11px] font-medium text-emerald-800">Remaining Dist</div>
              <div className="text-xl font-extrabold text-emerald-950 mt-0.5">
                {delivery.distance_remaining_km} <span className="text-xs font-normal">km</span>
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5">of {delivery.distance_km} km total</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="text-[11px] font-medium text-blue-800">Estimated Arrival</div>
              <div className="text-base font-extrabold text-blue-950 mt-1">
                {delivery.estimated_arrival}
              </div>
              <div className="text-[10px] text-blue-700/80 mt-0.5">Live Traffic Adjusted</div>
            </div>
          </div>

          {/* Origins & Destination */}
          <div className="space-y-3 text-xs pt-2">
            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-600 mt-0.5 ring-4 ring-emerald-100" />
              <div>
                <div className="font-semibold text-slate-900">Pickup Origin: Eluru</div>
                <div className="text-slate-500 text-[11px]">{delivery.pickup_location || 'Sanivarapupeta Farm, Eluru'}</div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-200 ml-1.5 my-0.5" />

            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-600 mt-0.5 ring-4 ring-blue-100" />
              <div>
                <div className="font-semibold text-slate-900">Delivery Destination: Rajahmundry</div>
                <div className="text-slate-500 text-[11px]">{delivery.delivery_location || 'Delta Agro Foods, Morampudi'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Highway Simulation Map Canvas */}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden min-h-[380px]">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

          {/* Map Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h5 className="font-bold text-sm tracking-wide text-white">Live NH-16 Corridor Telematics Track</h5>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/60">
              Progress: {progress}%
            </span>
          </div>

          {/* Visual Route Curve with Waypoints */}
          <div className="relative z-10 my-8 py-4">
            {/* Base Highway Track */}
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Truck Pin Position */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
              style={{ left: `${Math.max(5, Math.min(95, progress))}%` }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-xl border-2 border-white animate-gps-pulse">
                  <Truck className="w-5 h-5 text-slate-950" />
                </div>
                {/* Truck tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950 text-emerald-200 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
                  AP 37 TE 1234
                </div>
              </div>
            </div>

            {/* Key Waypoint Pins */}
            <div className="flex justify-between items-center mt-6 text-xs text-slate-300">
              <div className="text-left">
                <span className="block font-bold text-white">Eluru</span>
                <span className="text-[10px] text-slate-400">0 km (Farm)</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-slate-200">Tanuku</span>
                <span className="text-[10px] text-slate-400">40 km</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-slate-200">Kovvur Bridge</span>
                <span className="text-[10px] text-slate-400">57 km</span>
              </div>
              <div className="text-right">
                <span className="block font-bold text-white">Rajahmundry</span>
                <span className="text-[10px] text-slate-400">65 km (Plant)</span>
              </div>
            </div>
          </div>

          {/* Current GPS Coordinates Feed */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div>
              <span>Current GPS: </span>
              <strong className="text-emerald-300">
                16.{8500 + Math.round(progress * 2)}° N, 81.{4500 + Math.round(progress * 4)}° E
              </strong>
            </div>
            <div className="flex items-center gap-3">
              <span>Speed: <strong className="text-white">54 km/h</strong></span>
              <span>Temp: <strong className="text-white">Ambient 28°C</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 27: Delivery Timeline Component */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-bold text-slate-900 text-sm mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Fulfillment & Delivery Milestones (Section 27)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {timelineStages.map((stage, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center transition ${
                stage.completed
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : stage.current
                  ? 'bg-blue-50 border-blue-300 text-blue-950 ring-2 ring-blue-400/40'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex justify-center mb-1.5">
                {stage.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : stage.current ? (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                    ●
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="text-[11px] font-bold leading-tight">{stage.name}</div>
              <div className="text-[9px] mt-1 text-slate-500">
                {stage.completed ? 'Passed' : stage.current ? 'In Progress' : 'Pending'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
