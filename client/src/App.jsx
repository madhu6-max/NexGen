import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { NotificationToast } from './components/common/NotificationToast';
import { VoiceAssistant } from './components/common/VoiceAssistant';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

// Farmer Pages
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FarmerProfile } from './pages/farmer/FarmerProfile';
import { FarmerVerification } from './pages/farmer/FarmerVerification';
import { MarketIntelligencePage } from './pages/farmer/MarketIntelligencePage';
import { AddProducePage } from './pages/farmer/AddProducePage';
import { ProduceVerificationPage } from './pages/farmer/ProduceVerificationPage';
import { MyProducePage } from './pages/farmer/MyProducePage';
import { BuyerRequestsPage } from './pages/farmer/BuyerRequestsPage';
import { FarmerOrdersPage } from './pages/farmer/FarmerOrdersPage';
import { DeliveryTrackingPage } from './pages/farmer/DeliveryTrackingPage';
import { FarmerReturnsPage } from './pages/farmer/FarmerReturnsPage';

// Buyer Pages
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { BuyerOrgProfile } from './pages/buyer/BuyerOrgProfile';
import { CreateRequirementPage } from './pages/buyer/CreateRequirementPage';
import { MyRequirementsPage } from './pages/buyer/MyRequirementsPage';
import { MatchedSuppliersPage } from './pages/buyer/MatchedSuppliersPage';
import { SupplierDetailsPage } from './pages/buyer/SupplierDetailsPage';
import { BuyerNegotiationsPage } from './pages/buyer/BuyerNegotiationsPage';
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage';
import { BuyerReturnsPage } from './pages/buyer/BuyerReturnsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Smart Matching Hub (Bidirectional: Buyers & Farmers)
import { SmartMatchingPage } from './pages/common/SmartMatchingPage';

function MainApp() {
  const { role, user, toasts, dismissToast } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'landing';
  });
  const [navParams, setNavParams] = useState({});
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);

  // Sync with window hash or role
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setCurrentView(hash);
    } else if (role === 'guest' || !user) {
      setCurrentView('landing');
    }
  }, [role, user]);

  const handleNavigate = (view, params = {}) => {
    setCurrentView(view);
    setNavParams(params);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFullWidthPage = currentView === 'landing' || currentView === 'auth';

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthPage onNavigate={handleNavigate} />;

      // Farmer routes
      case 'farmer-dashboard':
        return <FarmerDashboard onNavigate={handleNavigate} />;
      case 'farmer-profile':
        return <FarmerProfile onNavigate={handleNavigate} />;
      case 'farmer-verification':
        return <FarmerVerification onNavigate={handleNavigate} />;
      case 'farmer-market':
        return <MarketIntelligencePage onNavigate={handleNavigate} />;
      case 'farmer-add-produce':
        return <AddProducePage onNavigate={handleNavigate} />;
      case 'farmer-produce-verify':
        return <ProduceVerificationPage produceId={navParams.produceId || 'prod_1'} onNavigate={handleNavigate} />;
      case 'farmer-produce':
        return <MyProducePage onNavigate={handleNavigate} />;
      case 'farmer-requests':
      case 'farmer-negotiations':
        return <BuyerRequestsPage onNavigate={handleNavigate} />;
      case 'farmer-orders':
        return <FarmerOrdersPage onNavigate={handleNavigate} />;
      case 'farmer-delivery':
        return <DeliveryTrackingPage onNavigate={handleNavigate} />;
      case 'farmer-returns':
        return <FarmerReturnsPage onNavigate={handleNavigate} />;

      // Buyer routes
      case 'buyer-dashboard':
        return <BuyerDashboard onNavigate={handleNavigate} />;
      case 'buyer-profile':
        return <BuyerOrgProfile onNavigate={handleNavigate} />;
      case 'buyer-create-requirement':
        return <CreateRequirementPage onNavigate={handleNavigate} />;
      case 'buyer-requirements':
        return <MyRequirementsPage onNavigate={handleNavigate} />;
      case 'buyer-matches':
        return <MatchedSuppliersPage requirementId={navParams.requirementId || 'req_1'} onNavigate={handleNavigate} />;
      case 'buyer-supplier-details':
        return <SupplierDetailsPage farmerId={navParams.farmerId || 'frm_1'} onNavigate={handleNavigate} />;
      case 'buyer-negotiations':
        return <BuyerNegotiationsPage onNavigate={handleNavigate} />;
      case 'buyer-orders':
        return <BuyerOrdersPage onNavigate={handleNavigate} />;
      case 'buyer-returns':
        return <BuyerReturnsPage initialOrderId={navParams.orderId} onNavigate={handleNavigate} />;

      // Admin routes
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;

      // Smart Matching Hub (Bidirectional: Farmers & Buyers)
      case 'smart-matching':
      case 'farmer-matches':
        return <SmartMatchingPage onNavigate={handleNavigate} />;

      default:
        return <FarmerDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Real-Time Live Notification Toast Stack */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} onNavigate={handleNavigate} />

      {/* Main Responsive Navbar */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)} />

      {/* 3. Main Body: Sidebar + Main View */}
      <div className="flex-1 flex w-full">
        {!isFullWidthPage && (
          <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        )}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${isFullWidthPage ? 'p-0 max-w-none' : ''}`}>
          {renderContent()}
        </main>
      </div>

      {/* 4. Multilingual AI Voice Assistant (English, Hindi, Telugu) */}
      <VoiceAssistant
        onNavigate={handleNavigate}
        currentView={currentView}
        isOpenExternal={voiceAssistantOpen}
        onCloseExternal={() => setVoiceAssistantOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">AgriLink</span>
            <span>•</span>
            <span>B2B Agricultural Supply-Chain & Escrow Platform</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Hackathon Build • Andhra Pradesh Demonstration Corridor
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
