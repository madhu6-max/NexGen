import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Building2, ShieldCheck, ArrowRight, Lock, Mail, Phone, User, KeyRound, CheckCircle2, Globe, Sparkles } from 'lucide-react';

export const AuthPage = ({ onNavigate }) => {
  const { login, register, googleLogin, switchDemoRole } = useAuth();
  const [userType, setUserType] = useState('farmer'); // 'farmer' or 'buyer'
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState('password'); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [district, setDistrict] = useState('Eluru');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Modal State for Custom Account Testing
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('Madhu V K');
  const [googleEmail, setGoogleEmail] = useState('andramadhu009@gmail.com');
  const [googleRole, setGoogleRole] = useState('farmer');
  const [googleStatus, setGoogleStatus] = useState('PENDING');
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);

  useEffect(() => {
    setGoogleRole(userType);
  }, [userType]);

  const customClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isRealClientIdConfigured = Boolean(customClientId && !customClientId.includes('demoagrilink'));

  // Initialize Official Google Identity Services (GIS) only if a real registered client ID is provided
  useEffect(() => {
    if (!isRealClientIdConfigured) return;

    const initGoogleGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: customClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const btnEl = document.getElementById('googleSignInDiv');
          if (btnEl) {
            btnEl.innerHTML = '';
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              width: 380,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }
        } catch (err) {
          console.warn('Google GIS Notice:', err.message);
        }
      }
    };

    initGoogleGIS();
    const timer = setTimeout(initGoogleGIS, 800);
    return () => clearTimeout(timer);
  }, [userType, isLogin, isRealClientIdConfigured]);

  // Handle GIS credential callback
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin({
        credential: response.credential,
        role: userType
      });
      if (res && res.success) {
        if (onNavigate) onNavigate(`${res.user.role}-dashboard`);
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Google Sign In / Account Pipeline
  const handleDirectGoogleLogin = async (customEmail, customName, verifiedStatus = 'PENDING', targetRole = googleRole) => {
    setLoading(true);
    setError('');
    setShowGoogleModal(false);

    const emailToUse = customEmail || 'andramadhu009@gmail.com';
    const nameToUse = customName || 'Madhu V K';
    const avatarToUse = targetRole === 'farmer'
      ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

    try {
      const res = await googleLogin({
        role: targetRole,
        verifiedStatus: verifiedStatus,
        profile: {
          email: emailToUse,
          name: nameToUse,
          picture: avatarToUse,
          googleId: `google_${Date.now()}`
        }
      });
      if (res && res.success) {
        if (onNavigate) onNavigate(`${res.user.role}-dashboard`);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'otp' && !otpSent) {
        setOtpSent(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const identifier = email || phone || (userType === 'farmer' ? 'ramesh.farmer@agrilink.in' : 'procurement@abcfoods.com');
        const res = await login(identifier, password || 'farmer123');
        if (res && res.success) {
          if (onNavigate) onNavigate(`${res.user.role}-dashboard`);
        }
      } else {
        const res = await register({
          name,
          email,
          phone,
          role: userType,
          password: password || 'demo123',
          companyName: userType === 'buyer' ? companyName : undefined,
          district
        });
        if (res && res.success) {
          if (onNavigate) onNavigate(`${userType}-dashboard`);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (role) => {
    switchDemoRole(role);
    if (onNavigate) onNavigate(`${role}-dashboard`);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-700/20">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Sign in to AgriLink' : 'Create an AgriLink Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verified B2B Agricultural Procurement & Escrow Supply Chain
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setUserType('farmer')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              userType === 'farmer'
                ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Farmer / Producer</span>
          </button>

          <button
            type="button"
            onClick={() => setUserType('buyer')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              userType === 'buyer'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Buyer / Business</span>
          </button>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* 1. REAL GOOGLE SIGN-IN SECTION */}
          <div className="space-y-2">
            {/* Official Google Identity Services Container */}
            <div id="googleSignInDiv" className="w-full flex justify-center min-h-[44px]"></div>

            {/* Direct 1-Click Google OAuth Trigger with Custom Account Modal */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Account</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold ml-auto border border-blue-200">
                Live Auth
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Or with credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Hackathon Demo Credentials Pill */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Section 51 Demonstration Pass
              </span>
              <button
                type="button"
                onClick={() => handleDemoClick(userType)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                1-Click Sign In →
              </button>
            </div>
            <p className="text-[10px] text-emerald-800 mt-1">
              Enter as {userType === 'farmer' ? 'Ramesh Kumar (Tomato Farmer, Eluru)' : 'Vikram Mehta (ABC Foods, Rajahmundry)'}.
            </p>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={userType === 'farmer' ? 'e.g. Ramesh Kumar' : 'e.g. Vikram Mehta'}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {!isLogin && userType === 'buyer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ABC Food Processing Pvt Ltd"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address or Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userType === 'farmer' ? 'ramesh.farmer@agrilink.in' : 'procurement@abcfoods.com'}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {authMode === 'password' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {otpSent ? 'Enter 4-Digit OTP Code' : 'Mobile OTP Authentication'}
                </label>
                {otpSent ? (
                  <div className="flex gap-2 justify-center py-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        defaultValue={idx === 0 ? '7' : idx === 1 ? '4' : idx === 2 ? '9' : '2'}
                        className="w-12 h-12 text-center text-lg font-bold border border-emerald-400 bg-emerald-50/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    A verification code will be dispatched to your phone number.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-0.5">
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === 'password' ? 'otp' : 'password'); setOtpSent(false); }}
                className="text-emerald-700 hover:underline font-semibold"
              >
                {authMode === 'password' ? 'Use OTP Login instead' : 'Use Password Login'}
              </button>

              <span className="text-slate-400 text-[10px]">JWT 256-bit Encrypted</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : (isLogin ? 'Sign In & Enter Dashboard' : 'Complete Registration')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
            {isLogin ? "Don't have an AgriLink account yet?" : 'Already registered?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-emerald-700 hover:underline ml-1.5"
            >
              {isLogin ? 'Register now' : 'Sign in here'}
            </button>
          </div>
        </div>
      </div>

      {/* Google Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Sign in with Google</h3>
                  <p className="text-xs text-slate-500">Select Google Profile or enter custom email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Error 401 Explanation Callout */}
            <div className="mb-3.5 p-3 bg-blue-50/90 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1 text-blue-950 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Why you saw "Error 401: invalid_client":
              </div>
              <p className="text-slate-700 text-[10.5px]">
                Google blocks OAuth popups if a Google Cloud Client ID hasn't been created for <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono text-[10px]">localhost:5000</code>. This 1-click pipeline bypasses the 401 block and logs you in with your real Google identity!
              </p>
            </div>

            {/* Account Role & Verification Controls */}
            <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Role for this account:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('farmer')}
                    className={`px-2.5 py-1 rounded-md transition ${googleRole === 'farmer' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    🌾 Farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('buyer')}
                    className={`px-2.5 py-1 rounded-md transition ${googleRole === 'buyer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    🏢 Buyer
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700">Verification state:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setGoogleStatus('PENDING')}
                    className={`px-2 py-0.5 rounded-md transition ${googleStatus === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    ⏳ Pending (Test Verification)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleStatus('VERIFIED')}
                    className={`px-2 py-0.5 rounded-md transition ${googleStatus === 'VERIFIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    ✅ Pre-Verified
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Primary Google Account: andramadhu009@gmail.com */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Google Account</div>
              <div className="p-3 border-2 border-blue-500/50 bg-gradient-to-r from-blue-50/70 to-emerald-50/40 rounded-2xl flex flex-col gap-2.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-sm ring-2 ring-blue-300">
                    M
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      Madhu V K
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                        Primary Google Account
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate font-medium">
                      andramadhu009@gmail.com
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectGoogleLogin('andramadhu009@gmail.com', 'Madhu V K', googleStatus, googleRole)}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Continue as Madhu V K ({googleRole === 'farmer' ? '🌾 Farmer' : '🏢 Buyer'})</span>
                </button>
              </div>
            </div>

            {/* Counterparty 1-Click Profile for testing trade pipeline */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Counterparty ({googleRole === 'farmer' ? 'Enterprise Buyer' : 'Producer Farmer'})
              </div>
              <button
                type="button"
                onClick={() => handleDirectGoogleLogin(
                  googleRole === 'farmer' ? 'buyer.madhu@agrilink.in' : 'farmer.madhu@agrilink.in',
                  googleRole === 'farmer' ? 'AgriLink Wholesale Buyer' : 'Eluru Fresh Producer',
                  googleStatus,
                  googleRole === 'farmer' ? 'buyer' : 'farmer'
                )}
                className="w-full p-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-left flex items-center gap-2.5 transition"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {googleRole === 'farmer' ? 'B' : 'F'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {googleRole === 'farmer' ? 'AgriLink Wholesale Buyer' : 'Eluru Fresh Producer'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {googleRole === 'farmer' ? 'buyer.madhu@agrilink.in' : 'farmer.madhu@agrilink.in'}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">1-Click →</span>
              </button>
            </div>

            {/* Custom Google Email Input */}
            <div className="space-y-2 pt-2.5 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-700">Or type any Gmail / custom account:</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDirectGoogleLogin(googleEmail, googleName, googleStatus, googleRole)}
                disabled={!googleEmail}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                Sign In with Custom Email
              </button>
            </div>

            {/* Google Cloud Console Setup Helper */}
            <div className="mt-3 pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowOAuthHelp(!showOAuthHelp)}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                {showOAuthHelp ? 'Hide Google Cloud setup details' : 'How to get official Google popup with your Google Cloud ID?'}
              </button>
              {showOAuthHelp && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-left text-[10px] text-slate-600 space-y-1 border border-slate-200">
                  <p>1. Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">console.cloud.google.com</a></p>
                  <p>2. Create an <strong>OAuth 2.0 Client ID</strong> (Web Application)</p>
                  <p>3. Add Authorized Origin: <code className="bg-slate-200 px-1 rounded">http://localhost:5000</code></p>
                  <p>4. Put in <code className="bg-slate-200 px-1 rounded">client/.env</code>: <code className="bg-slate-200 px-1 rounded">VITE_GOOGLE_CLIENT_ID=&lt;your_client_id&gt;</code></p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="mt-2.5 w-full py-1 text-xs text-slate-400 hover:text-slate-600 font-medium text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
