import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [role, setRole] = useState('guest'); // Clean start by default
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const seenNotifIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  // Toast Management
  const pushToast = (toast) => {
    const id = toast.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newToast = { ...toast, id };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep at most 4 active

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize or restore session (only if user explicitly has a token, otherwise clean guest start)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('agrilink_token');
        if (savedToken) {
          const res = await api.getMe();
          if (res && res.user) {
            setUser(res.user);
            setFarmer(res.farmer);
            setOrganization(res.organization);
            setRole(res.user.role);
            return;
          }
        }
        // Clean start: start as unauthenticated guest
        setRole('guest');
        setUser(null);
        setFarmer(null);
        setOrganization(null);
      } catch (err) {
        setRole('guest');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Fetch notifications with live toast detection
  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(user.id);
      if (res.success) {
        const list = res.notifications || [];
        setNotifications(list);
        setUnreadCount(res.unreadCount || 0);

        // Detect newly arrived notifications
        if (initialLoadDoneRef.current) {
          list.forEach((n) => {
            if (!seenNotifIdsRef.current.has(n.id) && !n.is_read) {
              pushToast({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                link: n.link
              });
            }
          });
        } else {
          initialLoadDoneRef.current = true;
        }

        // Record all current IDs as seen
        list.forEach((n) => seenNotifIdsRef.current.add(n.id));
      }
    } catch (err) {
      // Silently handle if network offline
    }
  };

  useEffect(() => {
    if (!user) return;
    initialLoadDoneRef.current = false;
    seenNotifIdsRef.current = new Set();
    fetchNotifs();

    // 3.5-second live polling for immediate real notifications
    const interval = setInterval(fetchNotifs, 3500);
    return () => clearInterval(interval);
  }, [user]);

  // Demo Switcher for Judges & Demonstrators
  const switchDemoRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await api.login({ role: targetRole, isDemoLogin: true });
      if (res.success) {
        localStorage.setItem('agrilink_token', res.token);
        localStorage.setItem('agrilink_role', targetRole);
        setUser(res.user);
        setFarmer(res.farmer);
        setOrganization(res.organization);
        setRole(res.user.role);
        return res;
      }
    } catch (err) {
      console.error('Switch demo role error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success) {
        localStorage.setItem('agrilink_token', res.token);
        localStorage.setItem('agrilink_role', res.user.role);
        setUser(res.user);
        setFarmer(res.farmer);
        setOrganization(res.organization);
        setRole(res.user.role);
        pushToast({
          title: `Welcome back, ${res.user.name}`,
          message: 'Signed in successfully to your AgriLink portal.',
          type: 'system'
        });
        return res;
      }
    } finally {
      setLoading(false);
    }
  };

  // Real Google Login
  const googleLogin = async (payload) => {
    setLoading(true);
    try {
      const res = await api.googleLogin(payload);
      if (res.success) {
        localStorage.setItem('agrilink_token', res.token);
        localStorage.setItem('agrilink_role', res.user.role);
        setUser(res.user);
        setFarmer(res.farmer);
        setOrganization(res.organization);
        setRole(res.user.role);
        pushToast({
          title: `Google Verified: ${res.user.name}`,
          message: `Connected via Google Account as ${res.user.role === 'farmer' ? 'Verified Farmer' : 'Verified Buyer'}.`,
          type: 'system'
        });
        return res;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      if (res.success) {
        localStorage.setItem('agrilink_token', res.token);
        localStorage.setItem('agrilink_role', res.user.role);
        setUser(res.user);
        setFarmer(res.farmer);
        setOrganization(res.organization);
        setRole(res.user.role);
        pushToast({
          title: 'Account Registered Successfully',
          message: `Welcome, ${res.user.name}! Please proceed to verification to start trading.`,
          type: 'system'
        });
        return res;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('agrilink_token');
    localStorage.removeItem('agrilink_role');
    setUser(null);
    setFarmer(null);
    setOrganization(null);
    setRole('guest');
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      if (role === 'farmer' && farmer) {
        const res = await api.getFarmerProfile(farmer.id);
        if (res.farmer) setFarmer(res.farmer);
      } else if (role === 'buyer' && organization) {
        const res = await api.getBuyerProfile(organization.id);
        if (res.organization) setOrganization(res.organization);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  // Farmer Verification Action
  const completeFarmerVerification = async () => {
    if (!farmer) return;
    setLoading(true);
    try {
      const res = await api.verifyAllFarmerSteps(farmer.id);
      if (res.success) {
        setFarmer(res.farmer);
        pushToast({
          title: '🎉 Farm Verification Certified!',
          message: 'All 4 verification stages approved! You can now publish certified produce.',
          type: 'order'
        });
        fetchNotifs();
        return res;
      }
    } finally {
      setLoading(false);
    }
  };

  // Buyer Verification Action
  const completeBuyerVerification = async (data = {}) => {
    if (!organization) return;
    setLoading(true);
    try {
      const res = await api.verifyBuyer(organization.id, data);
      if (res.success) {
        setOrganization(res.organization);
        pushToast({
          title: '🏢 Corporate GST Verification Approved!',
          message: 'Your organization is authenticated! You can now post requirements and place orders.',
          type: 'order'
        });
        fetchNotifs();
        return res;
      }
    } finally {
      setLoading(false);
    }
  };

  // Clean Reset Database (0 Users Slate)
  const resetToCleanSlate = async () => {
    setLoading(true);
    try {
      await api.cleanResetDatabase();
      logout();
      pushToast({
        title: '🧹 Clean Slate Reset Complete',
        message: 'All users and orders cleared. You can now register 1 farmer and 1 buyer from scratch!',
        type: 'system'
      });
      window.location.hash = 'landing';
    } catch (err) {
      console.error('Clean reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Restore Sample Demo Data
  const restoreSampleDemo = async () => {
    setLoading(true);
    try {
      await api.restoreDemoDatabase();
      await switchDemoRole('farmer');
      pushToast({
        title: '📦 Demo Dataset Restored',
        message: 'Ramesh Kumar and ABC Foods demo accounts are now active.',
        type: 'system'
      });
    } catch (err) {
      console.error('Restore demo error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate Live Event Notification for Demo
  const simulateLiveNotification = async (eventType) => {
    try {
      const res = await api.simulateNotification({
        userId: user?.id || 'usr_f1',
        eventType
      });
      if (res.success && res.notification) {
        pushToast({
          id: res.notification.id,
          title: res.notification.title,
          message: res.notification.message,
          type: res.notification.type,
          link: res.notification.link
        });
        seenNotifIdsRef.current.add(res.notification.id);
        fetchNotifs();
      }
    } catch (e) {
      console.error('Simulation error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      farmer,
      organization,
      role,
      loading,
      notifications,
      unreadCount,
      toasts,
      pushToast,
      dismissToast,
      switchDemoRole,
      login,
      googleLogin,
      register,
      logout,
      refreshProfile,
      completeFarmerVerification,
      completeBuyerVerification,
      resetToCleanSlate,
      restoreSampleDemo,
      simulateLiveNotification,
      fetchNotifs
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
