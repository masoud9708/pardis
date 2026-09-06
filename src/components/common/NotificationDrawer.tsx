import React from 'react';
import { NotificationItem } from '../../types';
import { Bell, X, CheckCheck, Car, Moon, CreditCard, MessageSquare, AlertTriangle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: number) => void;
  onMarkAllAsRead?: () => void;
  onNavigate?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onNavigate,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_TRIP':
      case 'ASSIGNED_TRIP':
        return <Car className="w-5 h-5 text-amber-400" />;
      case 'NEW_SHIFT':
      case 'SHIFT_REMINDER':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'DEBT_ALERT':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-5 h-5 text-teal-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-md bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">اعلان‌ها و رویدادها</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {notifications.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium px-2 py-1 rounded bg-teal-950/40 border border-teal-800/40"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                خوانده شد همه
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Bell className="w-10 h-10 opacity-30" />
              <p>هیچ اعلانی یافت نشد.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkAsRead(item.id)}
                className={`p-3.5 rounded-xl transition cursor-pointer flex gap-3 ${
                  item.is_read ? 'bg-transparent opacity-75' : 'bg-slate-800/40 border-r-4 border-r-amber-500'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-lg bg-slate-800 h-fit">{getIcon(item.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <span className="text-[10px] text-slate-500">{item.created_at?.slice(11, 16)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
