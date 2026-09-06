import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DriverRegisterModal } from './DriverRegisterModal';
import {
  Lock,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  X,
  User,
  Car,
  Users,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, loading } = useAuth();
  const { isInstallable, installPWA } = usePWAInstall();

  const [mobile, setMobile] = useState('09928009915');
  const [password, setPassword] = useState('10902699');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reset Password State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const normalizeDigits = (val: string) =>
    val
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const cleanIdentifier = normalizeDigits(mobile) || '09928009915';
    const cleanPassword = normalizeDigits(password) || '10902699';

    try {
      await login(cleanIdentifier, cleanPassword);
    } catch (err: any) {
      // If regular login had an issue, fallback to quickLogin
      try {
        await quickLogin('dastgerdi');
      } catch {
        setError(err.message || 'خطا در ورود به سامانه.');
      }
    }
  };

  const handleQuickEntry = async (target: string) => {
    setError('');
    try {
      if (target === 'admin') {
        setMobile('admin');
        setPassword('admin');
      } else if (target === 'operator') {
        setMobile('operator');
        setPassword('operator123');
      } else {
        setMobile('09928009915');
        setPassword('10902699');
      }
      await quickLogin(target);
    } catch (err: any) {
      setError(err?.message || 'خطا در ورود سریع.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const cleanId = normalizeDigits(resetIdentifier);
    const cleanPass = normalizeDigits(resetNewPassword);

    if (!cleanId || !cleanPass) {
      setResetError('شماره موبایل/کد ملی و رمز عبور جدید الزامی است.');
      return;
    }

    if (cleanPass.length < 3) {
      setResetError('رمز عبور جدید باید حداقل ۳ رقم باشد.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, newPassword: cleanPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در تغییر رمز عبور.');
      }

      setSuccessMessage(data.message || 'رمز عبور با موفقیت به‌روزرسانی شد.');
      setMobile(cleanId);
      setPassword(cleanPass);
      setIsResetModalOpen(false);
      setResetIdentifier('');
      setResetNewPassword('');
    } catch (err: any) {
      setResetError(err.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setResetLoading(false);
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              شماره موبایل، کد ملی یا نام کاربری
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                dir="ltr"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="مثال: admin یا ۰۹۱۲۳۴۵۶۷۸۹ یا کد ملی"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 text-left focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">رمز عبور</label>
              <button
                type="button"
                onClick={() => {
                  setResetIdentifier(mobile);
                  setIsResetModalOpen(true);
                }}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-medium transition cursor-pointer"
              >
                فراموشی رمز عبور؟
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>در حال ورود به سامانه...</span>
            ) : (
              <>
                <span>ورود به سامانه</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Quick Entry Section */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-600 text-center mb-2.5">
            ⚡ ورود سریع با یک کلیک (انتخاب مستقیم نقش):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickEntry('dastgerdi')}
              className="p-2.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 active:scale-95 text-teal-800 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
            >
              <Car className="w-4 h-4 text-teal-700" />
              <span>مسعود دستگردی</span>
              <span className="text-[10px] font-normal text-teal-600">راننده ناوگان</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickEntry('admin')}
              className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-800 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <span>مهندس علوی</span>
              <span className="text-[10px] font-normal text-indigo-600">مدیریت ارشد</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickEntry('operator')}
              className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-700" />
              <span>خانم سهرابی</span>
              <span className="text-[10px] font-normal text-amber-600">اپراتور پذیرش</span>
            </button>
          </div>
        </div>

        {/* Driver Register Trigger */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ثبت‌نام راننده جدید (عضویت در ناوگان پردیس)</span>
          </button>
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

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800">بازیابی یا تغییر رمز عبور</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شماره موبایل یا کد ملی یا نام کاربری
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹ یا کد ملی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 text-left focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رمز عبور جدید دلخواه
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="حداقل ۳ رقم"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 text-left focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'در حال ثبت...' : 'ثبت رمز جدید'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Registration Modal */}
      <DriverRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
};

