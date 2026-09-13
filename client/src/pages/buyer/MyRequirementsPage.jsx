import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Boxes, PlusCircle, Search, Filter, SearchCheck,
  Calendar, MapPin, ArrowRight
} from 'lucide-react';

export const MyRequirementsPage = ({ onNavigate }) => {
  const { organization } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReqs = async () => {
    try {
      const buyerId = organization ? organization.id : 'org_1';
      const res = await api.getRequirements({ buyerId });
      if (res.requirements) {
        setRequirements(res.requirements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReqs();
  }, [organization]);

  const filtered = requirements.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.crop_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Procurement Requirements (Section 18)</h2>
          <p className="text-xs text-slate-500">
            Manage corporate agricultural sourcing needs, monitor real-time supplier matches, and dispatch requests
          </p>
        </div>

        <button
          onClick={() => onNavigate('buyer-create-requirement')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Requirement</span>
        </button>
      </div>

      {/* Filter Bar (Section 18 Filters) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search requirement titles, crops, specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Matching">Matching</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      {/* Table (Section 18 Columns) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Req ID</th>
                <th className="py-3.5 px-3">Product</th>
                <th className="py-3.5 px-3">Quantity</th>
                <th className="py-3.5 px-3">Quality</th>
                <th className="py-3.5 px-3">Budget Ceiling</th>
                <th className="py-3.5 px-3">Delivery Location</th>
                <th className="py-3.5 px-3">Delivery Date</th>
                <th className="py-3.5 px-3 text-center">Matches</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  {/* Req ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {r.id}
                  </td>

                  {/* Product */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">{r.crop_name}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{r.title}</div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-3 font-bold text-slate-800">
                    {Number(r.quantity_kg).toLocaleString()} kg
                  </td>

                  {/* Quality */}
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-900">{r.quality_grade}</span>
                  </td>

                  {/* Budget */}
                  <td className="py-3.5 px-3">
                    <div className="font-black text-emerald-800 text-xs">
                      ₹{r.min_price_per_kg || Math.round(r.max_price_per_kg * 0.85)} - ₹{r.max_price_per_kg}/kg
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Est: ₹{((r.estimated_min_total || (r.quantity_kg * r.max_price_per_kg * 0.85)) / 100000).toFixed(2)}L - ₹{((r.estimated_max_total || (r.quantity_kg * r.max_price_per_kg)) / 100000).toFixed(2)}L
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-3 text-slate-700 truncate max-w-[130px]" title={r.delivery_location}>
                    {r.delivery_location}
                  </td>

                  {/* Delivery Date */}
                  <td className="py-3.5 px-3 text-slate-700">
                    {r.required_delivery_date}
                  </td>

                  {/* Matches */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => onNavigate('buyer-matches', { requirementId: r.id })}
                      className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition flex items-center gap-1 mx-auto"
                    >
                      <SearchCheck className="w-3 h-3 text-emerald-600" />
                      <span>{r.matches_count || 3} Matches</span>
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    <StatusBadge status={r.status} size="xs" />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigate('buyer-matches', { requirementId: r.id })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition"
                    >
                      Find Suppliers →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
