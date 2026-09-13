import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldAlert, Users, Building2, Boxes, ShoppingCart, Truck,
  RotateCcw, BarChart3, TrendingUp, CheckCircle2, AlertTriangle,
  Award, FileText, Check, X
} from 'lucide-react';

export const AdminDashboard = ({ onNavigate }) => {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal
  const [resolveReturnId, setResolveReturnId] = useState(null);
  const [adminDecision, setAdminDecision] = useState('PARTIAL REFUND');
  const [resolutionStatus, setResolutionStatus] = useState('Refund Processed');
  const [resolving, setResolving] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [ovRes, anRes, retRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminAnalytics(),
        api.getReturns()
      ]);

      if (ovRes.stats) setOverview(ovRes.stats);
      if (anRes.analytics) setAnalytics(anRes.analytics);
      if (retRes.returns) setReturnsList(retRes.returns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReturn = async (returnId) => {
    setResolving(true);
    try {
      await api.adminResolveReturn(returnId, {
        admin_decision: adminDecision,
        resolution_status: resolutionStatus
      });
      setResolveReturnId(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const stats = overview || {
    totalFarmers: 7,
    totalBuyers: 5,
    activeProduceListings: 20,
    activeSupplyTonnes: '345.5',
    activeRequirements: 6,
    activeDemandTonnes: '83.0',
    activeOrders: 2,
    activeDeliveries: 1,
    completedTransactions: 12,
    totalReturns: 1,
    totalGmvLakhs: '124.50'
  };

  const a = analytics || {
    supplyByCrop: [
      { crop: 'Paddy Rice', tonnes: 65 },
      { crop: 'Tomato', tonnes: 34.5 },
      { crop: 'Maize', tonnes: 57 },
      { crop: 'Banana', tonnes: 46 },
      { crop: 'Red Chilli', tonnes: 33 }
    ],
    demandByCrop: [
      { crop: 'Paddy Rice', tonnes: 25 },
      { crop: 'Maize', tonnes: 20 },
      { crop: 'Banana', tonnes: 15 },
      { crop: 'Red Chilli', tonnes: 10 },
      { crop: 'Tomato', tonnes: 8 }
    ],
    ordersByStatus: [
      { status: 'Completed', count: 12 },
      { status: 'In Transit', count: 1 },
      { status: 'Order Confirmed', count: 1 }
    ],
    topSuppliers: [
      { name: 'Lakshmi Devi', district: 'Guntur', reliability_score: 95, rating: 4.9, total_orders: 28 },
      { name: 'Satyanarayana Raju', district: 'West Godavari', reliability_score: 94, rating: 4.85, total_orders: 22 },
      { name: 'Ramesh Kumar', district: 'Eluru', reliability_score: 92, rating: 4.8, total_orders: 14 }
    ],
    topBuyers: [
      { company_name: 'Coastal Agro Exports', business_type: 'Exporter', trust_score: 98 },
      { company_name: 'Andhra Spice & Condiments', business_type: 'Processor', trust_score: 96 },
      { company_name: 'ABC Food Processing', business_type: 'Processor', trust_score: 95 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Executive Control Room • Platform Oversight</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Enterprise Admin Dashboard (Section 47)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time multi-district agricultural clearinghouse metrics, settlement escrow, and dispute arbitration
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-purple-300">Total Transacted GMV</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            ₹{stats.totalGmvLakhs} <span className="text-sm font-normal text-white">Lakhs</span>
          </div>
        </div>
      </div>

      {/* 8 Core Metrics (Section 47) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Farmers</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalFarmers}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">100% KYC'd</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Buyers</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalBuyers}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Corporates</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Active Produce</div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{stats.activeProduceListings}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.activeSupplyTonnes} Tons</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Requirements</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.activeRequirements}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.activeDemandTonnes} Tons</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Active Orders</div>
          <div className="text-2xl font-black text-blue-700 mt-0.5">{stats.activeOrders}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">In Transit</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Deliveries</div>
          <div className="text-2xl font-black text-purple-700 mt-0.5">{stats.activeDeliveries}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">GPS Monitored</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">{stats.completedTransactions}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Escrow Cleared</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Returns</div>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{stats.totalReturns}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Settled</div>
        </div>
      </div>

      {/* Analytics Charts Grid (Section 47) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply vs Demand Comparison by Crop */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Supply vs. Demand by Crop (Tonnes)
          </h4>

          <div className="space-y-3">
            {a.supplyByCrop.map((sc, i) => {
              const demandItem = a.demandByCrop.find(dc => dc.crop === sc.crop);
              const demandTonnes = demandItem ? demandItem.tonnes : 5;
              const maxVal = 70;

              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{sc.crop}</span>
                    <span className="text-[11px] text-slate-500">
                      Supply: <strong className="text-emerald-700">{sc.tonnes}T</strong> • Demand: <strong className="text-blue-700">{demandTonnes}T</strong>
                    </span>
                  </div>

                  {/* Dual Bar */}
                  <div className="flex gap-1.5 h-3">
                    <div
                      className="bg-emerald-500 rounded-md transition-all duration-500"
                      style={{ width: `${(sc.tonnes / maxVal) * 100}%` }}
                      title={`Supply: ${sc.tonnes}T`}
                    />
                    <div
                      className="bg-blue-500 rounded-md transition-all duration-500"
                      style={{ width: `${(demandTonnes / maxVal) * 100}%` }}
                      title={`Demand: ${demandTonnes}T`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600 font-medium">Available Farmer Supply (Tonnes)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-slate-600 font-medium">Buyer Procurement Demand (Tonnes)</span>
            </span>
          </div>
        </div>

        {/* Top Suppliers & Buyers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Top Certified Producers & Institutional Buyers
          </h4>

          <div className="space-y-2.5">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Top Tier Farmers:</span>
            {a.topSuppliers.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">#{i + 1} {s.name}</span>
                  <span className="text-[11px] text-slate-500">({s.district})</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-emerald-700 font-bold">{s.reliability_score}% Trust</span>
                  <span className="text-slate-700">{s.total_orders} Orders</span>
                  <span className="text-amber-600 font-bold">★ {s.rating}</span>
                </div>
              </div>
            ))}

            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block pt-2">Top Corporate Buyers:</span>
            {a.topBuyers.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">#{i + 1} {b.company_name}</span>
                  <span className="text-[11px] text-slate-500">({b.business_type})</span>
                </div>
                <div className="font-mono text-emerald-700 font-bold">
                  {b.trust_score}% Corporate Score
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Dispute & Returns Arbitration Panel (Section 30 & 47) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-purple-600" />
          Dispute Cases & Return Arbitration (Section 30)
        </h4>

        <div className="space-y-3">
          {returnsList.map((ret) => (
            <div key={ret.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-slate-900">{ret.return_code}</span>
                  <span className="text-slate-500 ml-2">Order: {ret.order_code} • {ret.buyer_company} vs. {ret.farmer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ret.admin_decision || 'Pending Review'} size="xs" />
                  <StatusBadge status={ret.resolution_status} size="xs" />
                  <button
                    onClick={() => setResolveReturnId(ret.id)}
                    className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px]"
                  >
                    Resolve Claim
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="font-bold text-rose-800">{ret.reason}: </span>
                <span className="text-slate-600">{ret.description} (Claimed: {ret.requested_qty_kg} kg)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Resolution Modal */}
      {resolveReturnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-sm text-slate-900">Arbitrate Return Case</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Decision (Section 29)</label>
                <select
                  value={adminDecision}
                  onChange={(e) => setAdminDecision(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  <option value="PARTIAL REFUND">PARTIAL REFUND (Credit note to buyer)</option>
                  <option value="REPLACEMENT">REPLACEMENT (Supplier ships fresh batch)</option>
                  <option value="ACCEPTED">ACCEPTED (Full escrow release to buyer)</option>
                  <option value="RETURN TO FARMER">RETURN TO FARMER (Freight refunded)</option>
                  <option value="REJECTED">REJECTED (Claim invalid, release to farmer)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="Resolved">Resolved</option>
                  <option value="Refund Processed">Refund Processed</option>
                  <option value="Replacement Sent">Replacement Sent</option>
                  <option value="Return Accepted">Return Accepted</option>
                  <option value="Case Closed">Case Closed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolveReturnId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveReturn(resolveReturnId)}
                disabled={resolving}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm"
              >
                {resolving ? 'Executing...' : 'Apply Official Arbitration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
