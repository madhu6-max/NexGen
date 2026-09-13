import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FarmerMatchedBuyersModal } from '../../components/common/FarmerMatchedBuyersModal';
import {
  Boxes, PlusCircle, Pause, Play, Edit, Eye, ShieldCheck,
  Search, Filter, ArrowRight, ExternalLink, Sparkles
} from 'lucide-react';

export const MyProducePage = ({ onNavigate }) => {
  const { farmer } = useAuth();
  const [produceList, setProduceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('all');

  // Edit Modal State
  const [editingProduce, setEditingProduce] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');

  // Matched Buyers Modal State
  const [selectedProduceForMatches, setSelectedProduceForMatches] = useState(null);
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);

  const fetchProduce = async () => {
    try {
      const farmerId = farmer ? farmer.id : 'frm_1';
      const res = await api.getProduceList({ farmerId });
      if (res.produce) {
        setProduceList(res.produce);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduce();
  }, [farmer]);

  const handleToggleStatus = async (item) => {
    try {
      const newStatus = item.status === 'Available' ? 'Paused' : 'Available';
      await api.updateProduce(item.id, { status: newStatus });
      fetchProduce();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduce) return;
    try {
      await api.updateProduce(editingProduce.id, {
        expected_price_per_kg: parseFloat(editPrice),
        available_qty_kg: parseFloat(editQty)
      });
      setEditingProduce(null);
      fetchProduce();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProduce = produceList.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = selectedCropFilter === 'all' || p.crop_id === selectedCropFilter;
    return matchesSearch && matchesCrop;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">My Produce Inventory</h2>
          <p className="text-xs text-slate-500">
            Active farm batches, quality verification status, and matched commercial buyer demands
          </p>
        </div>

        <button
          onClick={() => onNavigate('farmer-add-produce')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Batch</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by crop, variety, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
          >
            <option value="all">All Crops</option>
            <option value="crop_tomato">Tomato</option>
            <option value="crop_rice">Rice</option>
            <option value="crop_chilli">Chilli</option>
            <option value="crop_maize">Maize</option>
          </select>
        </div>
      </div>

      {/* Produce Inventory Table (Section 12 Columns Requirement) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Crop</th>
                <th className="py-3.5 px-3">Image</th>
                <th className="py-3.5 px-3">Total Qty</th>
                <th className="py-3.5 px-3">Available</th>
                <th className="py-3.5 px-3">Quality</th>
                <th className="py-3.5 px-3">Price</th>
                <th className="py-3.5 px-3">Location</th>
                <th className="py-3.5 px-3">Verification</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-center">Matched Buyers</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProduce.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  {/* Crop */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{p.crop_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                      {p.title}
                    </div>
                  </td>

                  {/* Image */}
                  <td className="py-3.5 px-3">
                    <img
                      src={p.image_url}
                      alt={p.crop_name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs"
                    />
                  </td>

                  {/* Total Qty */}
                  <td className="py-3.5 px-3 font-semibold text-slate-800">
                    {Number(p.total_qty_kg).toLocaleString()} kg
                  </td>

                  {/* Available Qty */}
                  <td className="py-3.5 px-3 font-bold text-emerald-800">
                    {Number(p.available_qty_kg).toLocaleString()} kg
                  </td>

                  {/* Quality Grade */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900">{p.quality_grade}</span>
                    <div className="text-[10px] text-slate-400">{p.is_organic ? 'Organic' : 'GAP'}</div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-3 font-black text-slate-900 text-sm">
                    ₹{p.expected_price_per_kg}<span className="text-[10px] font-normal text-slate-500">/kg</span>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-3 text-slate-700">
                    {p.district}
                  </td>

                  {/* Verification */}
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => onNavigate('farmer-produce-verify', { produceId: p.id })}
                      className="hover:opacity-80"
                    >
                      <StatusBadge status={p.verification_status} size="xs" />
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    <StatusBadge status={p.status} size="xs" />
                  </td>

                  {/* Matched Buyers (Section 12: e.g. 3 Matches) */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedProduceForMatches(p);
                        setMatchesModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition flex items-center gap-1 mx-auto"
                      title="View Matched Commercial Buyers"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{p.matched_buyers_count || 3} Matches</span>
                    </button>
                  </td>

                  {/* Actions (Edit, Pause listing, Update qty/price) */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProduce(p);
                          setEditPrice(p.expected_price_per_kg);
                          setEditQty(p.available_qty_kg);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Edit Price/Qty"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`p-1.5 rounded-lg border transition ${
                          p.status === 'Available'
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={p.status === 'Available' ? 'Pause Listing' : 'Activate Listing'}
                      >
                        {p.status === 'Available' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onNavigate('farmer-produce-verify', { produceId: p.id })}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="View 4-Step Verification"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal Popup */}
      {editingProduce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Update {editingProduce.crop_name} Parameters
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Price (₹/kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Quantity (kg)
                </label>
                <input
                  type="number"
                  step="500"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduce(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matched Commercial Buyers Modal */}
      {matchesModalOpen && selectedProduceForMatches && (
        <FarmerMatchedBuyersModal
          isOpen={matchesModalOpen}
          produce={selectedProduceForMatches}
          onClose={() => {
            setMatchesModalOpen(false);
            setSelectedProduceForMatches(null);
          }}
          onProposalSent={() => {
            fetchProduce();
          }}
        />
      )}
    </div>
  );
};
