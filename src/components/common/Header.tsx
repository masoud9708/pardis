import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Bell,
  LogOut,
  Download,
  WifiOff,
  UserCircle2,
  Car,
  Calendar,
  Menu,
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenNotifications: () => void;
  unreadCount?: number;
  currentTabLabel?: string;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  unreadCount = 0,
  currentTabLabel = 'پنل مدیریت کل',
  onToggleMobileNav,
}) => {
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const { isInstallable, installPWA } = usePWAInstall();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'مدیر ارشد آژانس';
      case 'OPERATOR':
        return 'اپراتور پذیرش و اعزام';
      case 'DRIVER':
        return 'راننده ناوگان';
      default:
        return 'کاربر';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 text-[#1e293b] sticky top-0 z-30 select-none">
      {/* Right Side: Tab Title & Date */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="منوی سامانه"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 bg-teal-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
            پ
          </div>
          <span className="font-bold text-sm text-[#0f172a]">تاکسی پردیس</span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <h1 className="text-base font-bold text-[#0f172a]">{currentTabLabel}</h1>
          <div className="h-5 w-px bg-slate-200"></div>
          <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>امروز | ساعت {currentTime}</span>
          </span>
        </div>

        {/* Online/Offline Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200">
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700">آنلاین</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              <span className="text-rose-700 flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                آفلاین
              </span>
            </>
          )}
        </div>
      </div>

      {/* Left Side: Actions, User Role Switcher & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        {isInstallable && (
          <button
            id="header-pwa-install-btn"
            onClick={installPWA}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">نصب اپلیکیشن</span>
          </button>
        )}

        {/* User Identity Badge (Role Switching Forbidden) */}
        <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-300 overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.full_name || 'کاربر'} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.full_name ? user.full_name.charAt(0) : 'ک'}</span>
            )}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold leading-none text-slate-800">
              {user?.full_name || 'کاربر'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{getRoleLabel(user?.role)}</p>
          </div>
        </div>

        {/* Notifications Button */}
        <button
          id="notifications-toggle-btn"
          onClick={onOpenNotifications}
          className="relative bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-600 transition active:scale-95"
          aria-label="اعلان‌ها"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '+۹' : unreadCount}
            </span>
          )}
        </button>

        {/* Logout Button */}
        <button
          id="header-logout-btn"
          onClick={logout}
          className="bg-slate-100 hover:bg-rose-50 p-2 rounded-full text-slate-500 hover:text-rose-600 transition active:scale-95"
          title="خروج از حساب"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
