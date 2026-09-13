import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle,
  Clock, MapPin, Eye, Info, Check, Sparkles, ShieldAlert
} from 'lucide-react';

export const FarmerVerification = ({ onNavigate }) => {
  const { farmer, completeFarmerVerification, refreshProfile } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const defaultSteps = [
    {
      step_number: 1,
      step_name: 'Step 1: Identity Verification',
      status: farmer?.verified_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      doc_type: 'Aadhaar / Farmer ID Card',
      notes: farmer?.verified_status === 'VERIFIED'
        ? `Biometric e-KYC token authenticated. Name: ${farmer?.name || 'Farmer'}.`
        : 'Pending document submission & biometric match.',
      verified_at: farmer?.verified_status === 'VERIFIED' ? '2026-08-01 10:30 AM' : null
    },
    {
      step_number: 2,
      step_name: 'Step 2: Farm Ownership / Cultivation Verification',
      status: farmer?.verified_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      doc_type: 'Pattadar Passbook / Webland AP 1B',
      notes: farmer?.verified_status === 'VERIFIED'
        ? `Survey No. 142/2A validated against ${farmer?.district || 'Eluru'} Revenue Records.`
        : 'Pending revenue land title registry cross-check.',
      verified_at: farmer?.verified_status === 'VERIFIED' ? '2026-08-01 02:15 PM' : null
    },
    {
      step_number: 3,
      step_name: 'Step 3: Farm Location Verification',
      status: farmer?.verified_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      doc_type: 'GPS Geotagged Field Survey',
      notes: farmer?.verified_status === 'VERIFIED'
        ? 'Coordinates match cadastral field boundary within 1.2m tolerance.'
        : 'Pending geotagged plot boundary coordinates.',
      verified_at: farmer?.verified_status === 'VERIFIED' ? '2026-08-02 09:00 AM' : null
    },
    {
      step_number: 4,
      step_name: 'Step 4: Crop / Produce Verification',
      status: farmer?.verified_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      doc_type: 'Harvest Stage & Drone Assessment',
      notes: farmer?.verified_status === 'VERIFIED'
        ? 'Crop maturity & fruit density verified. Ready for market listing.'
        : 'Pending agronomic visual check.',
      verified_at: farmer?.verified_status === 'VERIFIED' ? '2026-08-28 11:20 AM' : null
    }
  ];

  const fetchVerifications = async () => {
    if (!farmer) return;
    try {
      const res = await api.getFarmerProfile(farmer.id);
      if (res.verifications && res.verifications.length > 0) {
        setVerifications(res.verifications);
      } else {
        setVerifications(defaultSteps);
      }
    } catch (err) {
      setVerifications(defaultSteps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [farmer]);

  const handleSimulatedUpload = async (stepNum, stepName, docType) => {
    if (!farmer) return;
    setActionLoading(true);
    try {
      await api.verifyFarmerStep(farmer.id, {
        stepNumber: stepNum,
        stepName,
        docType,
        notes: `Authenticated via AgriLink Digital Land Validator for ${farmer.name}.`
      });
      setUploadSuccess(`Evidence successfully verified for ${stepName}!`);
      await fetchVerifications();
      if (refreshProfile) await refreshProfile();
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAll = async () => {
    setActionLoading(true);
    try {
      if (completeFarmerVerification) {
        await completeFarmerVerification();
      } else if (farmer) {
        await api.verifyAllFarmerSteps(farmer.id);
      }
      setUploadSuccess('🎉 All 4 verification stages approved! You are now a 100% Certified Producer.');
      await fetchVerifications();
      if (refreshProfile) await refreshProfile();
      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const isVerified = farmer?.verified_status === 'VERIFIED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Farmer Verification Center</h2>
          <p className="text-xs text-slate-500">
            Multi-stage producer credentialing, land registry cross-referencing, and agronomic verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Certification Status:</span>
            <StatusBadge status={isVerified ? 'VERIFIED' : 'PENDING'} size="lg" />
          </div>

          {!isVerified && (
            <button
              onClick={handleVerifyAll}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{actionLoading ? 'Verifying...' : 'Verify All 4 Stages Now'}</span>
            </button>
          )}
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Pending Alert banner if unverified */}
      {!isVerified && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-sm text-amber-950">Verification Action Required</h5>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                As a newly registered farmer ({farmer?.name || 'Producer'}), your account requires 4-step certification before buyers can confirm purchase contracts for your produce. Complete each step below or click <strong>Verify All 4 Stages Now</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Section 8 Disclaimer Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-slate-800">Verification Protocol Details</h5>
          <p className="text-slate-500 mt-0.5 leading-relaxed">
            Standard 4-Step verification enforces Aadhaar biometric hash validation, Andhra Pradesh Webland 1B revenue records, 1.2m GPS tolerance boundary survey, and harvest visual certification.
          </p>
        </div>
      </div>

      {/* 4 Verification Steps (Section 8) */}
      <div className="space-y-4">
        {verifications.map((step) => {
          const stepVerified = step.status === 'VERIFIED';
          return (
            <div
              key={step.step_number}
              className={`bg-white rounded-2xl p-6 border shadow-xs transition ${
                stepVerified ? 'border-slate-200 hover:border-emerald-300' : 'border-amber-300 bg-amber-50/10'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    stepVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {step.step_number}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{step.step_name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Document: <strong>{step.doc_type}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {step.verified_at ? new Date(step.verified_at).toLocaleDateString() : 'Awaiting Submission'}
                      </span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={step.status || 'PENDING'} />
              </div>

              <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                stepVerified ? 'bg-slate-50 text-slate-600 border-slate-100' : 'bg-amber-50/80 text-amber-900 border-amber-200'
              }`}>
                {stepVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">{stepVerified ? 'Verification Outcome: ' : 'Status: '}</span>
                  <span>{step.notes}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  Audit Seal: <code className="font-mono text-slate-600">SHA256_STEP{step.step_number}_{stepVerified ? 'CERTIFIED' : 'PENDING'}</code>
                </span>

                <button
                  onClick={() => handleSimulatedUpload(step.step_number, step.step_name, step.doc_type)}
                  disabled={actionLoading}
                  className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 text-xs transition ${
                    stepVerified
                      ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      : 'border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{stepVerified ? 'Re-Upload Evidence' : 'Submit & Verify This Step'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
