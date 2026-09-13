import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Sprout, Bell, User, LogOut, ChevronDown, Check, Menu, X, ExternalLink, Truck, PackageCheck, Handshake, Zap, Mic, Globe, Languages } from 'lucide-react';

export const Navbar = ({ currentView, onNavigate, onOpenVoiceAssistant }) => {
  const { user, role, logout, notifications, unreadCount, simulateLiveNotification, fetchNotifs } = useAuth();
  const { language, setLanguage, t, availableLanguages, currentLanguage } = useLanguage();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
      }
      setShowNotifs(false);
      if (notif.link && onNavigate) {
        const pageKey = notif.link.replace('/', '').replace('/', '-');
        onNavigate(pageKey);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate(role === 'guest' ? 'landing' : `${role}-dashboard`)}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">Agri<span className="text-emerald-600">Link</span></span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">B2B SaaS</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-none">Verified Agricultural Marketplace</p>
              </div>
            </button>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate && onNavigate('landing')}
              className={`px-3 py-2 rounded-lg transition ${currentView === 'landing' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              {t('nav.overview')}
            </button>

            {role === 'farmer' && (
              <>
                <button
                  onClick={() => onNavigate && onNavigate('farmer-verification')}
                  className={`px-3 py-2 rounded-lg transition ${currentView === 'farmer-verification' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {t('nav.farmer_verification')}
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('farmer-produce')}
                  className={`px-3 py-2 rounded-lg transition ${currentView === 'farmer-produce' || currentView === 'farmer-market' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {t('nav.my_produce')} & {t('nav.market_intelligence')}
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('farmer-orders')}
                  className={`px-3 py-2 rounded-lg transition ${currentView === 'farmer-orders' || currentView === 'farmer-delivery' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {t('nav.procurement_orders')}
                </button>
              </>
            )}

            {role === 'buyer' && (
              <>
                <button
                  onClick={() => onNavigate && onNavigate('buyer-profile')}
                  className={`px-3 py-2 rounded-lg transition ${currentView === 'buyer-profile' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {t('nav.buyer_profile')}
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('buyer-matches')}
                  className={`px-3 py-2 rounded-lg transition ${currentView === 'buyer-matches' || currentView === 'buyer-requirements' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {t('nav.matched_suppliers')}
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('buyer-orders')}
                  className={`px-3 py-2 rounded-lg transition ${currentView === 'buyer-orders' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {t('nav.procurement_orders')}
                </button>
              </>
            )}

            {role === 'admin' && (
              <button
                onClick={() => onNavigate && onNavigate('admin-dashboard')}
                className={`px-3 py-2 rounded-lg transition ${currentView === 'admin-dashboard' ? 'bg-slate-100 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                {t('nav.admin_control')}
              </button>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Multilingual Voice Assistant Button */}
            <button
              onClick={() => onOpenVoiceAssistant && onOpenVoiceAssistant()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition"
              title="Open AgriLink Multilingual AI Voice Assistant"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">{t('nav.voice_assistant')}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/20 uppercase font-black">{language}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-xs font-bold text-slate-700"
                title="Change Language (English / हिंदी / తెలుగు)"
              >
                <span className="text-sm leading-none">{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.native}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Language / भाषा
                  </div>
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition ${
                        language === l.code ? 'text-emerald-700 bg-emerald-50/60 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.native}</span>
                      </span>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title={t('nav.notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Clean Notification Drawer Popover without mock buttons */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                      <p className="text-xs text-slate-500">Live order & transaction updates</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {unreadCount} new
                        </span>
                      )}
                      <button
                        onClick={async () => {
                          if (user) {
                            await api.markAllNotificationsRead(user.id);
                            fetchNotifs && fetchNotifs();
                          }
                        }}
                        className="text-[11px] text-emerald-700 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => {
                        const isOrder = n.type === 'order';
                        const isDelivery = n.type === 'delivery';
                        const isNegotiation = n.type === 'negotiation' || n.type === 'request';
                        return (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left p-3 hover:bg-slate-50 transition flex gap-2.5 items-start ${n.is_read ? 'opacity-70' : 'bg-emerald-50/40'}`}
                          >
                            <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {isDelivery ? (
                                <Truck className="w-4 h-4 text-sky-600" />
                              ) : isOrder ? (
                                <PackageCheck className="w-4 h-4 text-emerald-600" />
                              ) : isNegotiation ? (
                                <Handshake className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Bell className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs text-slate-900 flex items-center justify-between">
                                <span className="truncate pr-2">{n.title}</span>
                                <span className="text-[10px] text-slate-400 font-normal flex-shrink-0">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="hidden sm:block text-left text-xs">
                    <div className="font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{user.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                      <span>{role}</span>
                      {user.avatar_url && (
                        <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700 font-bold">Google</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span className="truncate">{user.name}</span>
                        {user.avatar_url && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            Google Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate && onNavigate(role === 'farmer' ? 'farmer-profile' : 'buyer-profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        onNavigate && onNavigate('landing');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate && onNavigate('auth')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
              >
                {t('nav.sign_in')} / {t('nav.register')}
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {/* Mobile Language & Voice Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenVoiceAssistant && onOpenVoiceAssistant(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t('nav.voice_assistant')}</span>
            </button>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
              {availableLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 rounded-md transition ${language === l.code ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setMobileMenuOpen(false); onNavigate('landing'); }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700"
          >
            {t('nav.overview')}
          </button>
          {role === 'farmer' && (
            <>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('farmer-dashboard'); }} className="block w-full text-left py-2 text-sm text-slate-700 font-semibold">{t('nav.overview')}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('farmer-verification'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.farmer_verification')}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('farmer-produce'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.my_produce')} & {t('nav.market_intelligence')}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('farmer-orders'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.procurement_orders')}</button>
            </>
          )}
          {role === 'buyer' && (
            <>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('buyer-dashboard'); }} className="block w-full text-left py-2 text-sm text-slate-700 font-semibold">{t('nav.overview')}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('buyer-profile'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.buyer_profile')}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('buyer-matches'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.matched_suppliers')}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('buyer-orders'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.procurement_orders')}</button>
            </>
          )}
          {role === 'admin' && (
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('admin-dashboard'); }} className="block w-full text-left py-2 text-sm text-slate-700">{t('nav.admin_control')}</button>
          )}
        </div>
      )}
    </header>
  );
};
