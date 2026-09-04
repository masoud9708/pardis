import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DriverRegisterModal } from './DriverRegisterModal';
import {
  Car,
  Lock,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Headset,
  Sparkles,
  AlertCircle,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAs, loading } = useAuth();
  const { isInstallable, installPWA } = usePWAInstall();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const cleanIdentifier = mobile.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('نام کاربری یا شماره موبایل و رمز عبور را وارد نمایید.');
      return;
    }

    try {
      await login(cleanIdentifier, cleanPassword);
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به سامانه.');
    }
  };

  const handleRegisterSuccess = (driverId: number) => {
    setIsRegisterModalOpen(false);
    setSuccessMessage(
      `درخواست ثبت‌نام شما با شماره پیگیری #${driverId} ثبت گردید و پس از تأیید مدیریت پیامک فعال‌سازی ارسال خواهد شد.`
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Main Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-teal-600 text-white shadow-xs flex items-center justify-center font-bold text-xl">
            پ
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            سامانه تاکسی‌سرویس <span className="text-teal-600">پردیس</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">سامانه یکپارچه مدیریت، پذیرش و ناوگان رانندگان (PWA)</p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-green-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نام کاربری یا شماره موبایل</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                dir="ltr"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="نام کاربری یا شماره موبایل"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-800 placeholder-slate-400 text-left focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">رمز عبور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>در حال ورود...</span>
            ) : (
              <>
                <span>ورود به سامانه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Driver Register Trigger */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ثبت‌نام راننده جدید (عضویت در ناوگان پردیس)</span>
          </button>
        </div>

        {/* Quick 1-Click Evaluation Accounts */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 mb-2 text-center">
            ورود سریع جهت آزمون نقش‌های کاربری:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLoginAs('ADMIN')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-[11px]">مدیر ارشد</span>
              <span className="text-[9px] text-slate-400">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('OPERATOR')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Headset className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-[11px]">اپراتور</span>
              <span className="text-[9px] text-slate-400">Operator</span>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('DRIVER')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Car className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-[11px]">راننده</span>
              <span className="text-[9px] text-slate-400">Driver</span>
            </button>
          </div>
        </div>

        {/* PWA Install Button inside login if eligible */}
        {isInstallable && (
          <div className="mt-4">
            <button
              type="button"
              onClick={installPWA}
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>نصب نسخه پیشرو اپلیکیشن (PWA)</span>
            </button>
          </div>
        )}
      </div>

      {/* Driver Registration Modal */}
      <DriverRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
};
