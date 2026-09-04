import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/common/Header';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DriversManagement } from './components/admin/DriversManagement';
import { TripsManagement } from './components/admin/TripsManagement';
import { TariffsManagement } from './components/admin/TariffsManagement';
import { NightShiftManagement } from './components/admin/NightShiftManagement';
import { FinanceManagement } from './components/admin/FinanceManagement';
import { ReportsManagement } from './components/admin/ReportsManagement';
import { SettingsManagement } from './components/admin/SettingsManagement';
import { OperatorPanel } from './components/operator/OperatorPanel';
import { DriverPanel } from './components/driver/DriverPanel';
import { InternalChat } from './components/chat/InternalChat';
import { FleetLiveMap } from './components/admin/FleetLiveMap';
import { SmsManagement } from './components/admin/SmsManagement';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  LayoutDashboard,
  Users,
  Car,
  Calculator,
  Moon,
  CreditCard,
  BarChart3,
  MessageSquare,
  Settings,
  Headset,
  WifiOff,
  X,
  MapPin,
  Smartphone,
  Navigation,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-slate-800 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md animate-pulse">
          پ
        </div>
        <p className="text-xs font-bold text-slate-600">در حال راه‌اندازی سامانه تاکسی پردیس...</p>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return <LoginPage />;
  }

  const role = user?.role || 'ADMIN';

  const getNavItems = () => {
    if (role === 'DRIVER') {
      return [
        { id: 'driver', label: 'پنل کاری راننده', icon: Car },
        { id: 'finance', label: 'گزارش مالی و تسویه', icon: CreditCard },
        { id: 'chat', label: 'چت سازمانی', icon: MessageSquare, badge: '۳' },
      ];
    }
    if (role === 'OPERATOR') {
      return [
        { id: 'operator', label: 'پذیرش و اعزام سریع', icon: Headset },
        { id: 'map', label: 'نقشه زنده ناوگان', icon: Navigation },
        { id: 'trips', label: 'سفرهای جاری', icon: Car },
        { id: 'night-shifts', label: 'شیفت شب', icon: Moon },
        { id: 'chat', label: 'چت سازمانی', icon: MessageSquare, badge: '۳' },
      ];
    }
    // ADMIN Full Navigation
    return [
      { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
      { id: 'map', label: 'نقشه زنده ناوگان', icon: Navigation },
      { id: 'operator', label: 'میز اعزام اپراتور', icon: Headset },
      { id: 'drivers', label: 'مدیریت رانندگان', icon: Users },
      { id: 'trips', label: 'سفرهای جاری', icon: Car },
      { id: 'tariffs', label: 'تنظیمات تعرفه و POI', icon: Calculator },
      { id: 'sms', label: 'پیامک کاوه‌نگار', icon: Smartphone },
      { id: 'night-shifts', label: 'شیفت شب', icon: Moon },
      { id: 'finance', label: 'گزارشات مالی و کیف پول', icon: CreditCard },
      { id: 'reports', label: 'آمار و تحلیل', icon: BarChart3 },
      { id: 'chat', label: 'چت سازمانی', icon: MessageSquare, badge: '۳' },
      { id: 'settings', label: 'تنظیمات سامانه', icon: Settings },
    ];
  };

  const navItems = getNavItems();
  const currentTabValid = navItems.some((item) => item.id === activeTab);
  const currentTab = currentTabValid ? activeTab : navItems[0].id;
  const currentNavItem = navItems.find((n) => n.id === currentTab);

  return (
    <div dir="rtl" className="min-h-screen h-screen bg-[#f8fafc] flex flex-row font-sans overflow-hidden text-[#1e293b]">
      {/* High Density Desktop Sidebar Navigation */}
      <aside className="w-64 bg-[#0f172a] text-white hidden md:flex flex-col shrink-0 border-l border-slate-800 select-none">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-sm">
            پ
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block leading-tight text-white">تاکسی پردیس</span>
            <span className="text-[10px] text-slate-400">سامانه مدیریت ناوگان</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-right text-xs ${
                  isActive
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'opacity-80 text-slate-400'}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="mr-auto bg-rose-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Operational Footer Status */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>نسخه ۲.۴.۰ - عملیاتی</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-[#0f172a] text-white flex flex-col z-10 shadow-2xl h-full">
            <div className="p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-lg text-white">
                  پ
                </div>
                <span className="font-bold text-base text-white">تاکسی پردیس</span>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 text-xs overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-right ${
                      isActive ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-rose-500 text-[10px] px-1.5 py-0.5 rounded-full text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
              نسخه ۲.۴.۰ - عملیاتی
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 font-bold text-xs py-1 px-4 text-center flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>حالت آفلاین فعال است. تغییرات در دیتابیس کلاینت ذخیره می‌گردند.</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          onOpenNotifications={() => setIsNotifOpen(true)}
          currentTabLabel={currentNavItem?.label || 'پنل مدیریت'}
          onToggleMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Content Body */}
        <main className={`flex-1 overflow-y-auto ${currentTab === 'map' ? 'p-0 overflow-hidden' : 'p-4 sm:p-6 space-y-6'}`}>
          {currentTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
          {currentTab === 'map' && <FleetLiveMap />}
          {currentTab === 'operator' && <OperatorPanel />}
          {currentTab === 'drivers' && <DriversManagement />}
          {currentTab === 'trips' && <TripsManagement />}
          {currentTab === 'tariffs' && <TariffsManagement />}
          {currentTab === 'sms' && <SmsManagement />}
          {currentTab === 'night-shifts' && <NightShiftManagement />}
          {currentTab === 'finance' && <FinanceManagement />}
          {currentTab === 'reports' && <ReportsManagement />}
          {currentTab === 'chat' && <InternalChat />}
          {currentTab === 'settings' && <SettingsManagement />}
          {currentTab === 'driver' && <DriverPanel />}
        </main>

        {/* Mobile Bottom Navigation (Quick thumb access on smartphones) */}
        <nav className="md:hidden bg-white border-t border-slate-200 px-2 py-1 flex justify-around items-center z-20 shrink-0">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] ${
                  isActive ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-[55px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={setActiveTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
