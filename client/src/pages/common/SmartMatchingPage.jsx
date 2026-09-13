import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import { FarmerMatchedBuyersModal } from '../../components/common/FarmerMatchedBuyersModal';
import {
  SearchCheck, Sparkles, Filter, ShieldCheck, MapPin, Scale,
  DollarSign, Calendar, ArrowRight, Building2, User, Send,
  CreditCard, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw
} from 'lucide-react';

export const SmartMatchingPage = ({ onNavigate }) => {
  const { role, user, farmer, organization } = useAuth();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(role === 'buyer' ? 'buyer-view' : 'farmer-view');
  const [matches, setMatches] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [minScore, setMinScore] = useState(70);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  // Modals
  const [checkoutRequest, setCheckoutRequest] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [farmerProduceForModal, setFarmerProduceForModal] = useState(null);
  const [farmerModalOpen, setFarmerModalOpen] = useState(false);

  // Proposal modal for farmer
  const [proposalMatch, setProposalMatch] = useState(null);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalQty, setProposalQty] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Fetch Crops & Initial Matches
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cropRes, matchRes] = await Promise.all([
        api.getCrops().catch(() => ({ crops: [] })),
        api.getBrowseMatches({ minScore }).catch(() => ({ matches: [] }))
      ]);

      if (cropRes.crops) setCrops(cropRes.crops);
      if (matchRes.matches) setMatches(matchRes.matches);
    } catch (err) {
      console.error('Error fetching smart matching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [minScore]);

  // Filtered Matches
  const filteredMatches = matches.filter(m => {
    const matchCrop = selectedCrop === 'all' || m.cropId === selectedCrop;
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      m.cropName.toLowerCase().includes(searchLower) ||
      m.produce.farmerName.toLowerCase().includes(searchLower) ||
      m.produce.farmerDistrict.toLowerCase().includes(searchLower) ||
      m.requirement.buyerCompany.toLowerCase().includes(searchLower) ||
      m.requirement.buyerDistrict.toLowerCase().includes(searchLower);

    return matchCrop && matchSearch;
  });

  const handleOpenDirectCheckout = (match) => {
    // Generate synthesized request object for instant checkout
    const mockRequest = {
      id: `instant_req_${Date.now()}`,
      crop_name: match.cropName,
      quality_grade: match.produce.qualityGrade,
      farmer_name: match.produce.farmerName,
      farmer_id: match.produce.farmerId,
      produce_id: match.produce.id,
      buyer_id: organization ? organization.id : 'org_1',
      buyer_company: organization ? organization.company_name : 'ABC Food Processing Pvt Ltd',
      requested_qty_kg: Math.min(match.produce.availableQtyKg, match.requirement.quantityKg),
      offered_price_per_kg: match.produce.pricePerKg,
      counter_price_per_kg: match.produce.pricePerKg,
      delivery_location: `${match.requirement.buyerDistrict || 'Eluru'} Processing Plant`,
      farm_district: match.produce.farmerDistrict
    };

    setCheckoutRequest(mockRequest);
    setCheckoutOpen(true);
  };

  const handleOpenProposal = (match) => {
    setProposalMatch(match);
    setProposalPrice(match.produce.pricePerKg);
    setProposalQty(Math.min(match.produce.availableQtyKg, match.requirement.quantityKg));
    setProposalNote(`Offer from verified farmer ${match.produce.farmerName} for ${match.cropName} (${match.produce.qualityGrade})`);
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!proposalMatch) return;
    setSubmittingProposal(true);
    try {
      const res = await api.sendFarmerProposal({
        produce_id: proposalMatch.produce.id,
        requirement_id: proposalMatch.requirement.id,
        offered_price_per_kg: parseFloat(proposalPrice),
        offered_qty_kg: parseFloat(proposalQty),
        delivery_date: proposalMatch.requirement.requiredDeliveryDate,
        note: proposalNote
      });

      if (res.success) {
        setSuccessToast(`Commercial proposal dispatched to ${proposalMatch.requirement.buyerCompany}!`);
        setTimeout(() => {
          setSuccessToast('');
          setProposalMatch(null);
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send proposal: ' + err.message);
    } finally {
      setSubmittingProposal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AgriLink 5-Factor Matching Engine
              </span>
              <span className="text-xs text-slate-300 font-mono">Real-Time Supply & Demand</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              {role === 'farmer'
                ? (language === 'te' ? 'రైతు - వ్యాపారి స్మార్ట్ మ్యాచింగ్' : language === 'hi' ? 'किसान - खरीदार स्मार्ट मैचिंग' : 'Farmer & Buyer Smart Matching Hub')
                : (language === 'te' ? 'కొనుగోలుదారు - రైతు సరఫరా గుర్తింపు' : language === 'hi' ? 'खरीदार - किसान आपूर्ति मिलान' : 'Buyer & Farmer Smart Procurement Hub')}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
              {role === 'farmer'
                ? 'Discover commercial food processors and wholesalers seeking your exact harvest batches with 5-factor compatibility scoring.'
                : 'Instantly match corporate procurement requirements with verified farm produce lots across Andhra Pradesh.'}
            </p>
          </div>

          {/* Quick Perspective Toggle */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-xs">
            <button
              onClick={() => setActiveTab('farmer-view')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'farmer-view'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🌾 {language === 'hi' ? 'किसान दृष्टिकोण' : language === 'te' ? 'రైతు దృక్పథం' : 'Farmer View (Demands)'}
            </button>
            <button
              onClick={() => setActiveTab('buyer-view')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'buyer-view'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🏢 {language === 'hi' ? 'खरीदार दृष्टिकोण' : language === 'te' ? 'వ్యాపారి దృక్పథం' : 'Buyer View (Supply)'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by crop, farmer name, buyer company, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Crop Filter */}
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none font-medium text-slate-700"
          >
            <option value="all">All Crops</option>
            {crops.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Min Match Score */}
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none font-medium text-slate-700"
          >
            <option value={60}>Min Match: 60%+</option>
            <option value={70}>Min Match: 70%+</option>
            <option value={80}>Min Match: 80%+ (High)</option>
            <option value={90}>Min Match: 90%+ (Premium)</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Matches"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Match Results Feed */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <h3 className="font-bold text-sm text-slate-900">Calculating 5-Factor Rule-Based Match Scores...</h3>
          <p className="text-xs text-slate-500">
            Scoring Quantity (30%), Quality (25%), Proximity (20%), Delivery Date (15%), and Price (10%).
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center space-y-2">
          <SearchCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-900">No active matches found matching the current filters.</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try lowering the minimum match score threshold or clearing the search keyword.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong>{filteredMatches.length} Compatible Supply-Demand Pairs</strong>:</span>
            <span className="text-[11px] font-mono text-emerald-800 font-bold">5-Factor Scored & Verified</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMatches.map((match) => {
              const score = match.finalMatchScore;
              const isHigh = score >= 85;
              const isExpanded = expandedMatchId === match.id;

              return (
                <div
                  key={match.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isHigh ? 'border-emerald-300 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Score Badge & Core Match Pair */}
                    <div className="flex items-start gap-4 flex-1 min-w-[300px]">
                      {/* Match Score Badge */}
                      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black flex-shrink-0 border shadow-xs ${
                        isHigh
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        <span className="text-lg leading-none">{score}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">Match</span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900">
                            {match.cropName} ({match.produce.qualityGrade})
                          </span>

                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {match.distanceKm} km apart ({match.produce.farmerDistrict} ↔ {match.requirement.buyerDistrict})
                          </span>
                        </div>

                        {/* Two Sides Comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Farmer Side */}
                          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                              <User className="w-3 h-3 text-emerald-600" />
                              <span>Farmer Supplier</span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 mt-0.5">{match.produce.farmerName}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Stock: <strong>{Number(match.produce.availableQtyKg).toLocaleString()} kg</strong> at <strong className="text-emerald-800">₹{match.produce.pricePerKg}/kg</strong>
                            </div>
                          </div>

                          {/* Buyer Side */}
                          <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-blue-800 tracking-wider">
                              <Building2 className="w-3 h-3 text-blue-600" />
                              <span>Commercial Buyer</span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 mt-0.5">{match.requirement.buyerCompany}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Needs: <strong>{Number(match.requirement.quantityKg).toLocaleString()} kg</strong> • Budget: <strong className="text-blue-800">up to ₹{match.requirement.maxPricePerKg}/kg</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1"
                      >
                        <span>Score Radar</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {activeTab === 'farmer-view' ? (
                        <button
                          onClick={() => handleOpenProposal(match)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Commercial Offer</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDirectCheckout(match)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Instant Order & Pay via Razorpay</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded 5-Factor Score Radar Breakdown */}
                  {isExpanded && match.scoreBreakdown && (
                    <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs space-y-3">
                      <div className="flex items-center justify-between font-black text-slate-800 text-xs">
                        <span>5-FACTOR COMPATIBILITY AUDIT:</span>
                        <span className="text-emerald-700 font-bold">Calculated Score: {score}/100</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                        <div className="bg-white p-3 rounded-2xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>Quantity (30%)</span>
                            <span className="text-emerald-600">{match.scoreBreakdown.quantity.score}/30</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{match.scoreBreakdown.quantity.explanation}</p>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>Quality (25%)</span>
                            <span className="text-emerald-600">{match.scoreBreakdown.quality.score}/25</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{match.scoreBreakdown.quality.explanation}</p>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>Proximity (20%)</span>
                            <span className="text-emerald-600">{match.scoreBreakdown.location.score}/20</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{match.scoreBreakdown.location.explanation}</p>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>Date (15%)</span>
                            <span className="text-emerald-600">{match.scoreBreakdown.delivery.score}/15</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{match.scoreBreakdown.delivery.explanation}</p>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>Price (10%)</span>
                            <span className="text-emerald-600">{match.scoreBreakdown.price.score}/10</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{match.scoreBreakdown.price.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Farmer Direct Proposal Dialog */}
      {proposalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-sm text-slate-900">
                Dispatch Commercial Proposal to {proposalMatch.requirement.buyerCompany}
              </h4>
              <button
                onClick={() => setProposalMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Offer Price (₹/kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Buyer ceiling: ₹{proposalMatch.requirement.maxPricePerKg}/kg</span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Offer Quantity (kg)
                </label>
                <input
                  type="number"
                  required
                  max={proposalMatch.produce.availableQtyKg}
                  value={proposalQty}
                  onChange={(e) => setProposalQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Buyer requested: {Number(proposalMatch.requirement.quantityKg).toLocaleString()} kg</span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Proposal Notes
                </label>
                <textarea
                  rows={2}
                  value={proposalNote}
                  onChange={(e) => setProposalNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProposalMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {submittingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Commercial Offer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal */}
      {checkoutOpen && checkoutRequest && (
        <CheckoutModal
          isOpen={checkoutOpen}
          request={checkoutRequest}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(order) => {
            setSuccessToast(`Order #${order.order_code} successfully created and secured via Razorpay!`);
            setCheckoutOpen(false);
            if (onNavigate) onNavigate('buyer-orders');
          }}
        />
      )}
    </div>
  );
};
