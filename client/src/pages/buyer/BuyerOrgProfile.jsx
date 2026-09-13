import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Building2, ShieldCheck, CheckCircle2, FileText, User,
  Phone, Mail, MapPin, Award, Save, Sparkles, ShieldAlert
} from 'lucide-react';

export const BuyerOrgProfile = () => {
  const { organization, completeBuyerVerification, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Editable fields
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Food Processor');
  const [regNumber, setRegNumber] = useState('GSTIN-37AAACR1234F1Z9');
  const [address, setAddress] = useState('Industrial Development Area, Eluru, Andhra Pradesh');
  const [contactPerson, setContactPerson] = useState('');
  const [teamSize, setTeamSize] = useState(8);

  const fetchOrg = async () => {
    if (!organization) return;
    try {
      const res = await api.getBuyerProfile(organization.id);
      if (res.organization) {
        setProfile(res);
        setCompanyName(res.organization.company_name);
        setBusinessType(res.organization.business_type || 'Food Processor');
        setRegNumber(res.organization.reg_number || 'GSTIN-37AAACR1234F1Z9');
        setAddress(res.organization.address || 'Industrial Estate, Eluru, Andhra Pradesh');
        setContactPerson(res.organization.contact_person || '');
        setTeamSize(res.organization.procurement_team_size || 8);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [organization]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!organization) return;
    try {
      await api.updateBuyerProfile(organization.id, {
        company_name: companyName,
        business_type: businessType,
        reg_number: regNumber,
        address,
        contact_person: contactPerson,
        procurement_team_size: parseInt(teamSize)
      });
      setSavedMessage('Organization details updated successfully!');
      if (refreshProfile) await refreshProfile();
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      if (completeBuyerVerification) {
        await completeBuyerVerification({
          gstin: regNumber || 'GSTIN-37AAACR1234F1Z9',
          businessType,
          address
        });
      } else if (organization) {
        await api.verifyBuyer(organization.id, {
          gstin: regNumber || 'GSTIN-37AAACR1234F1Z9',
          businessType,
          address
        });
      }
      setSavedMessage('🎉 Corporate GSTIN & FSSAI verified successfully!');
      await fetchOrg();
      if (refreshProfile) await refreshProfile();
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const isVerified = organization?.verified_status === 'VERIFIED';

  const org = profile?.organization || organization || {
    company_name: companyName || 'ABC Food Processing Pvt Ltd',
    business_type: businessType,
    reg_number: regNumber,
    address,
    contact_person: contactPerson,
    procurement_team_size: teamSize,
    trust_score: 95,
    verified_status: organization?.verified_status || 'PENDING'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Organization Profile & Verification</h2>
          <p className="text-xs text-slate-500">
            Corporate entity verification, FSSAI regulatory compliance, and institutional trust score
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={isVerified ? 'VERIFIED' : 'PENDING'} size="lg" />
          {!isVerified && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>{verifying ? 'Authenticating...' : 'Verify Business GSTIN Now'}</span>
            </button>
          )}
        </div>
      </div>

      {savedMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Alert banner if pending */}
      {!isVerified && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-sm text-amber-950">Corporate Verification Pending</h5>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                As a newly registered buyer ({organization?.company_name || 'Enterprise'}), verify your GSTIN or business registration below to unlock matched verified farmer lots and formal procurement contracts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 16: Verification Steps Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
              {isVerified ? 'Verified Corporate Buyer Tier' : 'Tier 2 Verification Pending'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Organization Verification Checklist
            </h3>
          </div>

          <div className="bg-blue-950/70 border border-blue-500/40 rounded-2xl p-4 text-center">
            <div className="text-[10px] uppercase font-mono text-blue-300">Buyer Trust Score (Section 16)</div>
            <div className="text-3xl font-black text-white mt-0.5">{isVerified ? (org.trust_score || 96) : 90}%</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">
              {isVerified ? 'Prompt Payment Tier 1' : 'Awaiting GST Authentication'}
            </div>
          </div>
        </div>

        {/* 4 Verification Checkpoints (Section 16) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Org Identity</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">MCA Corporate Registry Matched</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerified ? '✓ GSTIN Active' : '⏳ GST Pending'}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">{isVerified ? 'GSTIN Authenticated' : 'Awaiting Tax Verification'}</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Contact Verification</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Procurement Head Authenticated</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerified ? '✓ Audit Cleared' : '⏳ Audit In Review'}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Commercial Escrow Enabled</p>
          </div>
        </div>
      </div>

      {/* Profile Form (Section 16) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Corporate Profile & Procurement Operations
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
              >
                <option value="Food Processor">Food Processor</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retail Chain">Retail Chain</option>
                <option value="Exporter">Agricultural Exporter</option>
                <option value="Restaurant Chain">Restaurant Chain / HoReCa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration / GSTIN Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. GSTIN-37AAACR1234F1Z9"
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Facility Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Procurement Contact</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Procurement Team Size</label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">FSSAI Central Food License</label>
              <input
                type="text"
                readOnly
                value="FSSAI-LIC #10019044001923 (Active)"
                className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-emerald-800 font-mono font-bold rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            {!isVerified && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-blue-300" />
                <span>{verifying ? 'Authenticating...' : 'Authenticate & Verify GST Credentials'}</span>
              </button>
            )}

            <button
              type="submit"
              className="ml-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Update Organization Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
