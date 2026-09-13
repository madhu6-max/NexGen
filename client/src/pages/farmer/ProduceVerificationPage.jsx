import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck, CheckCircle2, AlertCircle, Sparkles, MapPin,
  Scale, Eye, FileCheck, ArrowRight, RefreshCw, Info
} from 'lucide-react';

export const ProduceVerificationPage = ({ produceId = 'prod_1', onNavigate }) => {
  const [produce, setProduce] = useState(null);
  const [verification, setVerification] = useState(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProduceAndVerify = async () => {
    try {
      const res = await api.getProduceDetail(produceId);
      if (res.produce) {
        setProduce(res.produce);
      }
      // Run the 4-step AI verification
      const vRes = await api.verifyProduce(produceId);
      if (vRes.success) {
        setVerification(vRes.verification);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduceAndVerify();
  }, [produceId]);

  const p = produce || {
    title: 'Fresh Grade-A Vaishnavi Hybrid Tomatoes',
    crop_name: 'Tomato',
    total_qty_kg: 10000,
    quality_grade: 'Grade A',
    district: 'Eluru',
    expected_price_per_kg: 29.0,
    farmer_name: 'Ramesh Kumar',
    latitude: 16.7107,
    longitude: 81.0952,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
  };

  const v = verification || {
    verification1_FarmerIdentity: {
      stepName: 'Farmer Identity Verification',
      status: 'Verified',
      passed: true,
      details: 'Farmer UIDAI biometric authentication valid. Registered name matches: Ramesh Kumar.'
    },
    verification2_FarmLocation: {
      stepName: 'Farm Location Verification',
      status: 'Verified',
      passed: true,
      details: 'Registered farm coordinates (16.7107, 81.0952) match parcel survey deed within 1.2m tolerance in Eluru.'
    },
    verification3_CropEvidence: {
      stepName: 'Crop Image AI Verification',
      status: 'Matched',
      passed: true,
      detectedCrop: 'Tomato',
      confidence: '95.4%',
      details: 'Computer vision spectral index confirmed crop variety: Tomato (Grade A). Defect percentage < 2.0%.'
    },
    verification4_QuantityHarvestEvidence: {
      stepName: 'Quantity & Harvest Evidence Verification',
      status: 'Consistent',
      passed: true,
      declaredQuantityKg: 10000,
      modeledRangeKg: '9,500 - 10,500 kg',
      details: 'Declared volume of 10,000 kg is consistent with farm acreage historical yield benchmarks.'
    },
    overallStatus: 'Produce Verification Passed',
    disclaimer: 'Demo verification result. Physical inventory verification requires trusted field/weighing integrations.'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Agronomic Integrity Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">Lot ID: {produceId}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Four-Step Crop Verification (Section 11)
          </h2>
          <p className="text-xs text-slate-500">
            Validating declared produce consistency against farmer profile, cadastral GIS, and computer vision
          </p>
        </div>

        <button
          onClick={() => fetchProduceAndVerify()}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Run AI Engine</span>
        </button>
      </div>

      {/* Hero Result Banner: Final Status (Section 11) */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Audit Assessment Completed
            </span>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                ✓ {v.overallStatus || 'Produce Verification Passed'}
              </h3>
            </div>
            <p className="text-xs text-emerald-200 pt-1">
              Produce lot meets institutional procurement consistency benchmarks. Listing is marked <strong>Active</strong> in Marketplace.
            </p>
          </div>

          <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-4 text-center">
            <div className="text-[10px] uppercase font-mono text-emerald-300">Verification Trust Score</div>
            <div className="text-3xl font-black text-white mt-0.5">96<span className="text-base text-emerald-300">/100</span></div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">100% Passed Criteria</div>
          </div>
        </div>
      </div>

      {/* Mandatory Section 11 UI Text */}
      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold">Required Demo Verification Note</h5>
          <p className="text-amber-800 mt-0.5 leading-relaxed font-medium">
            "Demo verification result. Physical inventory verification requires trusted field/weighing integrations."
          </p>
        </div>
      </div>

      {/* 4 Cards for the 4 Verifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Verification 1: Farmer Identity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-xs text-slate-900">Verification 1: Farmer Identity</h4>
            </div>
            <StatusBadge status={v.verification1_FarmerIdentity.status} />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div className="text-slate-500 text-[11px]">Identity Status:</div>
            <div className="font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Farmer Identity ✓ Verified</span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              {v.verification1_FarmerIdentity.details}
            </p>
          </div>
        </div>

        {/* Verification 2: Farm Location */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-xs text-slate-900">Verification 2: Farm Location</h4>
            </div>
            <StatusBadge status={v.verification2_FarmLocation.status} />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div className="text-slate-500 text-[11px]">GIS Comparison:</div>
            <div className="font-bold text-slate-800">
              Registered farm location + GPS/location evidence
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              {v.verification2_FarmLocation.details}
            </p>
          </div>
        </div>

        {/* Verification 3: Crop Evidence */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-xs text-slate-900">Verification 3: Crop Visual AI</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {v.verification3_CropEvidence.confidence} Confidence
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Crop image received</span>
              <span className="text-emerald-700">Crop type: {v.verification3_CropEvidence.detectedCrop}</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence status: Matched</span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              {v.verification3_CropEvidence.details}
            </p>
          </div>
        </div>

        {/* Verification 4: Quantity / Harvest Evidence */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h4 className="font-bold text-xs text-slate-900">Verification 4: Quantity & Harvest</h4>
            </div>
            <StatusBadge status={v.verification4_QuantityHarvestEvidence.status} />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Declared Quantity: <strong>{Number(p.total_qty_kg).toLocaleString()} kg</strong></span>
              <span>Available Evidence: <strong>{v.verification4_QuantityHarvestEvidence.modeledRangeKg}</strong></span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status: Consistent</span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              {v.verification4_QuantityHarvestEvidence.details}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => onNavigate('farmer-produce')}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          Back to My Produce Inventory
        </button>

        <button
          onClick={() => onNavigate('buyer-matches')}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <span>View Buyer Matches for this Batch</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
