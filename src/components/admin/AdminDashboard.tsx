import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AgencyReportSummary, Trip, Driver, NightShift } from '../../types';
import {
  Car,
  TrendingUp,
  CreditCard,
  Moon,
  Users,
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<AgencyReportSummary | null>(null);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tonightShift, setTonightShift] = useState<NightShift | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, tripsRes, driversRes, shiftsRes] = await Promise.allSettled([
        api.getReportsSummary(),
        api.getTrips(),
        api.getDrivers(),
        api.getNightShifts(),
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value);
      }
      if (tripsRes.status === 'fulfilled') {
        setActiveTrips(tripsRes.value);
      }
      if (driversRes.status === 'fulfilled') {
        setDrivers(driversRes.value);
      }
      if (shiftsRes.status === 'fulfilled') {
        const today = shiftsRes.value.find((s) => s.status !== 'CANCELLED');
        setTonightShift(today || null);
      }

      // If all critical endpoints failed, provide friendly error message
      if (
        sumRes.status === 'rejected' &&
        tripsRes.status === 'rejected' &&
        driversRes.status === 'rejected'
      ) {
        const firstErr = (sumRes as PromiseRejectedResult).reason;
        setError(firstErr?.message || 'خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      }
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
      setError(err?.message || 'خطا در بارگذاری اطلاعات داشبورد.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onlineDrivers = drivers.filter((d) => d.status === 'ONLINE');
  const pendingDrivers = drivers.filter((d) => d.status === 'PENDING');

  const filteredTrips = activeTrips.filter((trip) => {
    if (!searchQuery) return true;
    return (
      trip.customer_name?.includes(searchQuery) ||
      trip.origin?.includes(searchQuery) ||
      trip.destination?.includes(searchQuery) ||
      trip.driver_name?.includes(searchQuery) ||
      trip.trip_number?.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Quick Bar / Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-800">پیشخوان مدیریت و کنترل عملیات</h1>
          <p className="text-xs text-slate-500 mt-0.5">وضعیت زنده ناوگان، آمار روزانه و آخرین سفرهای تاکسی پردیس</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs disabled:opacity-60 cursor-pointer"
          title="بروزرسانی اطلاعات"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'در حال دریافت...' : 'بروزرسانی'}</span>
        </button>
      </div>

      {/* Error Recovery Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">{error}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">ارتباط با سرور مجدداً برقرار خواهد شد.</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shrink-0"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Top Banner Alert for Pending Driver Registrations */}
      {pendingDrivers.length > 0 && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-orange-950 text-xs">
                {pendingDrivers.length} درخواست ثبت‌نام راننده جدید در انتظار بررسی است!
              </h4>
              <p className="text-[11px] text-orange-800/90 mt-0.5">
                مدارک هویتی و خودروهای رانندگان متقاضی آماده اعتبارسنجی توسط مدیریت آژانس می‌باشد.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('drivers')}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs whitespace-nowrap self-end sm:self-auto"
          >
            بررسی و تأیید رانندگان
          </button>
        </div>
      )}

      {/* High Density Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trips Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 mb-1">سفرهای ثبت‌شده</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {(summary?.total_trips || 0).toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
              +{summary?.completed_trips || 0} موفق
            </span>
          </div>
        </div>

        {/* Total Gross Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 mb-1">درآمد ناخالص (تومان)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {((summary?.total_revenue || 0) + (summary?.total_commission || 0)).toLocaleString('fa-IR')}
            </span>
          </div>
        </div>

        {/* Commission Share */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 mb-1">کمیسیون خالص آژانس</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-600">
              {(summary?.total_commission || 0).toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-400">۱۵٪ سهم</span>
          </div>
        </div>

        {/* Active Drivers */}
        <div
          onClick={() => onNavigate('map')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-r-4 border-r-emerald-500 hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 mb-1">رانندگان آماده‌باش</p>
            <span className="text-[10px] text-teal-600 font-bold group-hover:underline">نقشه زنده ←</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{onlineDrivers.length}</span>
            <span className="text-[10px] text-slate-400">از {drivers.length} نفر</span>
          </div>
        </div>
      </div>

      {/* Mid Section: Trips Table (2 cols) and Right Column Widgets (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-800">آخرین درخواست‌های سفر</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {activeTrips.length}
              </span>
            </div>
            <button
              onClick={() => onNavigate('trips')}
              className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="p-3 font-medium text-slate-400">شناسه</th>
                  <th className="p-3 font-medium text-slate-400">مسافر</th>
                  <th className="p-3 font-medium text-slate-400">مبدأ / مقصد</th>
                  <th className="p-3 font-medium text-slate-400">راننده</th>
                  <th className="p-3 font-medium text-slate-400">مبلغ (تومان)</th>
                  <th className="p-3 font-medium text-slate-400">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTrips.slice(0, 8).map((trip) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium">
                      در مسیر
                    </span>
                  );
                  if (trip.status === 'COMPLETED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-medium">
                        تکمیل شده
                      </span>
                    );
                  } else if (trip.status === 'REQUESTED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-medium">
                        جدید
                      </span>
                    );
                  } else if (trip.status === 'CANCELLED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-medium">
                        لغو شده
                      </span>
                    );
                  } else if (trip.status === 'ASSIGNED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-medium">
                        تخصیص یافته
                      </span>
                    );
                  }

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-600">{trip.trip_number}</td>
                      <td className="p-3 font-bold text-slate-800">{trip.customer_name}</td>
                      <td className="p-3 text-slate-600 truncate max-w-[180px]">
                        {trip.origin} <span className="text-slate-400">←</span> {trip.destination}
                      </td>
                      <td className="p-3 text-slate-500">
                        {trip.driver_name || <span className="text-slate-400 italic">در انتظار تخصیص...</span>}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {trip.price.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-3">{statusBadge}</td>
                    </tr>
                  );
                })}

                {filteredTrips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      هیچ سفری با مشخصات مدنظر یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در سفرهای امروز..."
                className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => onNavigate('operator')}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
            >
              ثبت سفر تلفنی جدید
            </button>
          </div>
        </div>

        {/* Right Column Widgets */}
        <div className="flex flex-col gap-6">
          {/* Night Shift Card - Stylized Dark Element as in Design HTML */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500 opacity-10 rounded-full -translate-x-12 -translate-y-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">
                  شیفت شب فعال
                </span>
                <span className="text-xs opacity-60">امشب</span>
              </div>

              {tonightShift ? (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 text-teal-300 font-bold text-sm">
                      {tonightShift.driver_name?.charAt(0) || 'ش'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{tonightShift.driver_name}</p>
                      <p className="text-[10px] opacity-60">
                        {tonightShift.car_name} - {tonightShift.license_plate}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/10 pt-4">
                    <span>
                      ساعت کاری: {tonightShift.start_time} الی {tonightShift.end_time}
                    </span>
                    <span className="text-teal-400 font-bold">عملیاتی</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <p className="text-xs text-slate-300">راننده کشیک امشب ثبت نشده است.</p>
                  <button
                    onClick={() => onNavigate('night-shifts')}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition"
                  >
                    تعیین راننده شیفت شب
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Online Fleet Summary Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col p-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="font-bold text-sm text-slate-800">رانندگان آماده‌باش</h2>
              <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {onlineDrivers.length} راننده
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-56">
              {onlineDrivers.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <span className="font-bold text-slate-800 block">{d.full_name}</span>
                      <span className="text-[10px] text-slate-400">{d.car_name}</span>
                    </div>
                  </div>
                  <span className="font-mono text-slate-600 font-bold text-[11px]">
                    {d.license_plate}
                  </span>
                </div>
              ))}

              {onlineDrivers.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  در حال حاضر هیچ راننده‌ای آنلاین نیست.
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('drivers')}
                className="w-full py-1.5 text-center text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition"
              >
                مشاهده و مدیریت کلیه رانندگان ←
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
