import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard, ShieldCheck, TrendingUp, ShoppingCart,
  SearchCheck, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Sparkles
} from 'lucide-react';

export const Sidebar = ({ currentView, onNavigate }) => {
  const { role, farmer, organization, user } = useAuth();
  const { language, t } = useLanguage();

  // Navigation for Farmer
  const farmerTabs = [
    {
      key: 'farmer-dashboard',
      label: language === 'hi' ? 'डैशबोर्ड' : language === 'te' ? 'డ్యాష్‌బోర్డ్' : 'Dashboard',
      subtext: language === 'hi' ? 'कमाई और ऑर्डर का सारांश' : language === 'te' ? 'ఆదాయం & ఆర్డర్ల సారాంశం' : 'Overview & recent activity',
      icon: LayoutDashboard,
      badge: null
    },
    {
      key: 'smart-matching',
      label: language === 'hi' ? 'खरीदार मैचिंग' : language === 'te' ? 'కొనుగోలుదారుల మ్యాచ్' : 'Smart Buyer Matches',
      subtext: language === 'hi' ? 'आपकी फसलों के खरीदार' : language === 'te' ? 'డిమాండ్ & స్మార్ట్ మ్యాచ్' : 'Active buyer demands (95%)',
      icon: Sparkles,
      badge: '95% Match'
    },
    {
      key: 'farmer-produce',
      label: language === 'hi' ? 'मेरी फसलें व मंडी भाव' : language === 'te' ? 'నా పంటలు & మార్కెట్ రేట్లు' : 'My Produce & Mandi Rates',
      subtext: language === 'hi' ? 'फसल जोड़ें और लाइव मंडी दरें' : language === 'te' ? 'పంటను జోడించండి & మార్కెట్' : 'Publish lot & check APMC prices',
      icon: TrendingUp,
      badge: 'Live APMC'
    },
    {
      key: 'farmer-verification',
      label: language === 'hi' ? 'किसान सत्यापन (KYC)' : language === 'te' ? 'రైతు ధృవీకరణ (KYC)' : 'Farmer KYC Verification',
      subtext: language === 'hi' ? 'आधार, जमीन व फसल सत्यापन' : language === 'te' ? 'ఆధార్, పట్టాదారు పాస్బుక్' : '4-Step official credentialing',
      icon: ShieldCheck,
      badge: farmer?.verified_status === 'VERIFIED' ? (language === 'hi' ? 'प्रमाणित' : language === 'te' ? 'సర్టిఫైడ్' : 'Verified') : '4 Steps'
    },
    {
      key: 'farmer-orders',
      label: language === 'hi' ? 'ऑर्डर व डिलीवरी' : language === 'te' ? 'ఆర్డర్లు & డెలివరీ' : 'Orders & Delivery',
      subtext: language === 'hi' ? 'सौदा पक्का करें और ट्रैक करें' : language === 'te' ? 'ఖరీదు ఒప్పందాలు & జీపీఎస్' : 'Contracts, dispatch & GPS transit',
      icon: ShoppingCart,
      badge: null
    }
  ];

  // Navigation for Buyer
  const buyerTabs = [
    {
      key: 'buyer-dashboard',
      label: language === 'hi' ? 'डैशबोर्ड' : language === 'te' ? 'డ్యాష్‌బోర్డ్' : 'Dashboard',
      subtext: language === 'hi' ? 'खरीद और खर्च का सारांश' : language === 'te' ? 'కొనుగోలు ఖర్చుల సారాంశం' : 'Procurement overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      key: 'smart-matching',
      label: language === 'hi' ? 'किसान खोजें व मैच' : language === 'te' ? 'రైతులను కలవండి & మ్యాచ్' : 'Smart Supply Matching',
      subtext: language === 'hi' ? 'सत्यापित किसान व फसलें' : language === 'te' ? 'ధృవీకరించిన రైతులను కలవండి' : '5-factor supply matching',
      icon: Sparkles,
      badge: 'Smart Match'
    },
    {
      key: 'buyer-orders',
      label: language === 'hi' ? 'खरीद आदेश व ट्रैकिंग' : language === 'te' ? 'ఆర్డర్లు & ట్రాకింగ్' : 'Orders & Tracking',
      subtext: language === 'hi' ? 'एस्क्रो भुगतान और डिलीवरी' : language === 'te' ? 'ఎస్క్రో చెల్లింపు & డెలివరీ' : 'Contracts, escrow & GPS fleet',
      icon: ShoppingCart,
      badge: null
    },
    {
      key: 'buyer-profile',
      label: language === 'hi' ? 'कंपनी सत्यापन' : language === 'te' ? 'సంస్థ ధృవీకరణ' : 'Company Verification',
      subtext: language === 'hi' ? 'जीएसटी और एफएसएसएआई' : language === 'te' ? 'జీఎస్టీ & ఎఫ్‌ఎస్‌ఎస్‌ఏఐ' : 'GSTIN & business credentials',
      icon: ShieldCheck,
      badge: organization?.verified_status === 'VERIFIED' ? 'Verified' : 'Pending'
    }
  ];

  // Admin tab
  const adminTabs = [
    {
      key: 'admin-dashboard',
      label: language === 'hi' ? 'एडमिन कंट्रोल रूम' : language === 'te' ? 'అడ్మిన్ కంట్రోల్' : 'Admin Control Room',
      subtext: 'Platform management & escrow oversight',
      icon: LayoutDashboard,
      badge: 'Admin'
    }
  ];

  const tabs = role === 'farmer' ? farmerTabs : role === 'buyer' ? buyerTabs : adminTabs;
  const isVerified = role === 'farmer'
    ? farmer?.verified_status === 'VERIFIED'
    : organization?.verified_status === 'VERIFIED';

  return (
    <aside aria-label="Simplified navigation" className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      {/* User Status Profile Card */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-sm shadow-xs">
              {role === 'farmer' ? '🌾' : role === 'buyer' ? '🏢' : '🛡️'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {user?.name || (role === 'farmer' ? 'Farmer' : 'Buyer')}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  {language === 'hi' ? 'सत्यापित' : language === 'te' ? 'ధృవీకరించబడింది' : 'Verified'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                  <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                  {language === 'hi' ? 'सत्यापन आवश्यक' : language === 'te' ? 'ధృవీకరణ పెండింగ్' : 'KYC Pending'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Clean Navigation Tabs */}
      <div className="p-3 space-y-1.5 flex-1">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {language === 'hi' ? 'मुख्य मेनू' : language === 'te' ? 'ప్రధాన మెనూ' : 'Main Menu'}
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate && onNavigate(tab.key)}
              className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 border ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                  : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs truncate ${isActive ? 'font-bold text-emerald-950' : 'font-semibold text-slate-900'}`}>
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold flex-shrink-0 ${
                      isActive ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10.5px] leading-tight line-clamp-1 mt-0.5 ${
                  isActive ? 'text-emerald-700 font-medium' : 'text-slate-400'
                }`}>
                  {tab.subtext}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Verification Prompt at bottom if pending */}
      {!isVerified && role !== 'admin' && (
        <div className="p-3 m-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
          <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'hi' ? 'सत्यापन अधूरा है' : language === 'te' ? 'ధృవీకరణ పూర్తి కాలేదు' : 'Complete Verification'}</span>
          </div>
          <p className="text-[10px] text-amber-800 leading-tight mb-2">
            {language === 'hi' ? 'व्यापार शुरू करने के लिए अपना सत्यापन पूरा करें।' : language === 'te' ? 'వ్యాపారం చేయడానికి మీ ధృవీకరణ పూర్తి చేయండి.' : 'Verify your profile to unlock orders & escrow trading.'}
          </p>
          <button
            onClick={() => onNavigate && onNavigate(role === 'farmer' ? 'farmer-verification' : 'buyer-profile')}
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-xl transition shadow-xs"
          >
            {language === 'hi' ? 'अभी सत्यापित करें →' : language === 'te' ? 'ఇప్పుడే ధృవీకరించండి →' : 'Verify Now →'}
          </button>
        </div>
      )}
    </aside>
  );
};
