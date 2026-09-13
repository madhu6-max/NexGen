import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Sprout, ShieldCheck, TrendingUp, SearchCheck, Handshake,
  Truck, Award, RotateCcw, ArrowRight, CheckCircle2, ChevronRight,
  Building2, Users, Store, Utensils, Globe, Sparkles, Mic
} from 'lucide-react';

export const LandingPage = ({ onNavigate }) => {
  const { role, user } = useAuth();
  const { language, t } = useLanguage();

  const handleSelectRole = (targetRole, destination) => {
    if (!user) {
      if (onNavigate) onNavigate('auth');
    } else {
      if (onNavigate) onNavigate(destination);
    }
  };

  const howItWorksSteps = [
    { num: '01', title: language === 'te' ? 'ధృవీకరణ (KYC)' : language === 'hi' ? 'सत्यापन (KYC)' : 'Verified KYC', desc: language === 'te' ? 'ఆధార్ & భూమి లేదా కంపెనీ రిజిస్ట్రేషన్.' : language === 'hi' ? 'आधार और भूमि या कंपनी पंजीकरण।' : 'Aadhaar, land records & company registration.' },
    { num: '02', title: language === 'te' ? 'మార్కెట్ ధరలు & పంట' : language === 'hi' ? 'मंडी भाव और उपज' : 'Mandi Rates & Produce', desc: language === 'te' ? 'తాజా APMC మార్కెట్ ధరలు & పంట వివరాలు.' : language === 'hi' ? 'लाइव एपीएमसी मंडी भाव और उपज लिस्टिंग।' : 'Live APMC mandi rates & verified harvest listing.' },
    { num: '03', title: language === 'te' ? 'ఆర్డర్లు & డీల్స్' : language === 'hi' ? 'ऑर्डर और सौदे' : 'Orders & Agreements', desc: language === 'te' ? 'నేరుగా కొనుగోలుదారులతో చర్చలు మరియు ఆర్డర్లు.' : language === 'hi' ? 'व्यापारियों से सीधे ऑर्डर और पारदर्शी सौदे।' : 'Direct matching, negotiation & verified purchase orders.' },
    { num: '04', title: language === 'te' ? 'డెలివరీ & చెల్లింపులు' : language === 'hi' ? 'डिलीवरी और भुगतान' : 'Delivery & Payouts', desc: language === 'te' ? 'లైవ్ GPS ట్రాకింగ్ & నేరుగా బ్యాంక్ ఖాతాకు జమ.' : language === 'hi' ? 'लाइव जीपीएस ट्रैकिंग और सुरक्षित बैंक भुगतान।' : 'Live GPS tracking, inspection & protected payouts.' }
  ];

  const whyCards = [
    { icon: SearchCheck, title: 'Smart Direct Matching', desc: 'Direct connections between verified farmers and bulk buyers without middleman cuts.' },
    { icon: ShieldCheck, title: 'Official KYC Verification', desc: 'Aadhaar, land patta, and GST verification for trust and security.' },
    { icon: TrendingUp, title: 'Live Mandi Benchmarks', desc: 'Daily APMC government mandi rates across Andhra Pradesh, Telangana, and Pan-India.' },
    { icon: Truck, title: 'GPS Order Tracking', desc: 'Real-time transit updates from harvest gate to delivery warehouse.' }
  ];

  const userTypes = [
    { name: 'Farmers', desc: 'Individual growers & cultivators', icon: Sprout, role: 'farmer' },
    { name: 'FPOs', desc: 'Farmer Producer Collectives', icon: Users, role: 'farmer' },
    { name: 'Food Processors', desc: 'Milling & processing units', icon: Building2, role: 'buyer' },
    { name: 'Wholesalers', desc: 'APMC mandi distributors', icon: Store, role: 'buyer' },
    { name: 'Retailers & HoReCa', desc: 'Supermarkets & restaurants', icon: Utensils, role: 'buyer' },
    { name: 'Exporters', desc: 'Certified agricultural exporters', icon: Globe, role: 'buyer' }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300/60 text-emerald-900 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Direct B2B Agricultural Marketplace</span>
          </div>

          {/* Master Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Connect Farms to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600">
              Real Direct Demand
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {language === 'te'
              ? 'రైతులను విశ్వసనీయ కొనుగోలుదారులతో నేరుగా అనుసంధానించే సులభమైన వేదిక.'
              : language === 'hi'
              ? 'किसानों और विश्वसनीय खरीदारों को सीधे जोड़ने वाला सरल एवं सुरक्षित मंच।'
              : 'Empowering farmers and verified buyers with transparent prices, instant matching, and secure delivery.'}
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleSelectRole('farmer', 'farmer-dashboard')}
              className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <Sprout className="w-5 h-5" />
              <span>{language === 'te' ? 'నేను రైతును (Farmer)' : language === 'hi' ? 'मैं किसान हूँ (Farmer)' : "I'm a Farmer"}</span>
            </button>

            <button
              onClick={() => handleSelectRole('buyer', 'buyer-dashboard')}
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-900/20 transition transform hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <Building2 className="w-5 h-5" />
              <span>{language === 'te' ? 'నేను కొనుగోలుదారుని (Buyer)' : language === 'hi' ? 'मैं खरीदार हूँ (Buyer)' : "I'm a Buyer"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* How AgriLink Works (Section 4) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
            End-to-End Producer-to-Buyer Pipeline
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            How AgriLink Works
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            An 8-stage commercial supply chain protocol designed for frictionless agricultural transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {howItWorksSteps.map((s, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition group">
              <div className="font-mono text-2xl font-black text-emerald-600/60 group-hover:text-emerald-700 transition mb-2">
                {s.num}
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">{s.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why AgriLink? (8 Cards - Section 4) */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
              Built for Enterprise Procurement
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Why AgriLink?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Unlike consumer-oriented listing portals, AgriLink delivers verified commercial reliability at institutional scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1.5">{card.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Types Section (Section 4) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
            Ecosystem Participants
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            Tailored For All Agricultural Stakeholders
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {userTypes.map((u, idx) => {
            const Icon = u.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSelectRole(u.role, `${u.role}-dashboard`)}
                className="bg-white rounded-2xl p-4 border border-slate-200 text-center hover:border-emerald-400 hover:shadow-sm transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">{u.name}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{u.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-4xl font-black">
              {language === 'te' ? 'నేరుగా వ్యవసాయ వ్యాపారం ప్రారంభించండి' : language === 'hi' ? 'सीधे कृषि व्यापार शुरू करें' : 'Start Direct Agricultural Trading'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
              {language === 'te'
                ? 'ధృవీకరించబడిన ఖాతాను సృష్టించండి, నేరుగా మార్కెట్ ధరలు మరియు ఆర్డర్లను ప్రారంభించండి.'
                : language === 'hi'
                ? 'सत्यापित खाता बनाएं, सीधे मंडी भाव और व्यापार ऑर्डर शुरू करें।'
                : 'Create your verified account, check live mandi rates, and start direct trade.'}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleSelectRole('farmer', 'farmer-dashboard')}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                {language === 'te' ? 'రైతుగా ప్రారంభించండి' : language === 'hi' ? 'किसान के रूप में शुरू करें' : 'Get Started as Farmer'}
              </button>
              <button
                onClick={() => handleSelectRole('buyer', 'buyer-dashboard')}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition"
              >
                {language === 'te' ? 'కొనుగోలుదారుగా ప్రారంభించండి' : language === 'hi' ? 'खरीदार के रूप में शुरू करें' : 'Get Started as Buyer'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
