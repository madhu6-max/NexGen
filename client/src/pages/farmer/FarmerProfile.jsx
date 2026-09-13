import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  User, MapPin, Award, CheckCircle2, ShieldCheck, Landmark,
  Calendar, Layers, Save, Phone, Mail, Building
} from 'lucide-react';

export const FarmerProfile = () => {
  const { farmer } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [fpo, setFpo] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const farmerId = farmer ? farmer.id : 'frm_1';
        const res = await api.getFarmerProfile(farmerId);
        if (res.farmer) {
          setProfile(res);
          setName(res.farmer.name);
          setPhone(res.farmer.phone);
          setVillage(res.farmer.village);
          setDistrict(res.farmer.district);
          setFarmSize(res.farmer.farm_size_acres);
          setFpo(res.farmer.fpo_name);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [farmer]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const farmerId = farmer ? farmer.id : 'frm_1';
      await api.updateFarmerProfile(farmerId, {
        name,
        phone,
        village,
        district,
        farm_size_acres: parseFloat(farmSize),
        fpo_name: fpo
      });
      setSavedMessage('Profile updated successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const f = profile?.farmer || {
    name: 'Ramesh Kumar',
    phone: '+91 98480 12345',
    email: 'ramesh.farmer@agrilink.in',
    village: 'Sanivarapupeta',
    district: 'Eluru',
    state: 'Andhra Pradesh',
    farm_size_acres: 12.5,
    experience_years: 18,
    fpo_name: 'Godavari Delta Vegetable FPO',
    bank_account_placeholder: 'SBI-XXXX-4921',
    reliability_score: 92,
    rating: 4.8,
    total_orders: 14
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Farmer Profile</h2>
          <p className="text-xs text-slate-500">Verified agricultural producer identity and institutional credentials</p>
        </div>
        <StatusBadge status="VERIFIED" size="lg" />
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
          {savedMessage}
        </div>
      )}

      {/* Section 7 Trust Panel */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Institutional Trust Score: {f.reliability_score}%
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400 text-slate-950">
              Top 5% Verified Producer
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            Profile Verification Trust Panel
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/50">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Identity</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Aadhaar Biometric KYC Validated</p>
            </div>

            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/50">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Farm</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Webland AP 1B Land Deed Checked</p>
            </div>

            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/50">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Location</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">GPS Polygon Cadastral Geofence</p>
            </div>

            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/50">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Historical Activity</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">{f.total_orders} Completed Orders ({f.rating}★)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Form Card (Section 7) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            Farmer Details & Land Holdings
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                readOnly
                value={f.email || 'ramesh.farmer@agrilink.in'}
                className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Village</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                readOnly
                value="Andhra Pradesh"
                className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Size (Acres)</label>
              <input
                type="number"
                step="0.5"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Farming</label>
              <input
                type="number"
                readOnly
                value={f.experience_years || 18}
                className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Main Crops</label>
              <input
                type="text"
                readOnly
                value="Tomato, Sweet Corn, Green Chilli"
                className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">FPO Membership</label>
              <input
                type="text"
                value={fpo}
                onChange={(e) => setFpo(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Escrow Account Placeholder</label>
              <div className="relative">
                <Landmark className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  readOnly
                  value={f.bank_account_placeholder || 'SBI-XXXX-4921 (Verified)'}
                  className="w-full text-xs pl-9 pr-3 py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
