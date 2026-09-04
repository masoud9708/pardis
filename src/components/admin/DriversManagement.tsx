import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Driver, DriverStatus } from '../../types';
import {
  Users,
  Search,
  CheckCircle,
  Car,
  ShieldCheck,
  X,
  FileCheck2,
} from 'lucide-react';

export const DriversManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await api.getDrivers({ search, status: statusFilter });
      setDrivers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, statusFilter]);

  const loadDriverDetails = async (id: number) => {
    setSelectedDriverId(id);
    try {
      const data = await api.getDriver(id);
      setDriverDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyDriver = async (id: number, status: 'ACTIVE' | 'REJECTED') => {
    let rejection_reason: string | undefined = undefined;
    if (status === 'REJECTED') {
      const reason = prompt('لطفاً دلیل رد مدارک راننده را وارد نمایید (این متن به عنوان پیامک برای راننده ارسال می‌شود):', 'عدم وضوح تصویر گواهینامه رانندگی یا کارت خودرو');
      if (reason === null) return;
      rejection_reason = reason;
    }

    setActionLoading(true);
    try {
      await api.verifyDriver(id, { status, rejection_reason });
      await fetchDrivers();
      if (selectedDriverId === id) {
        await loadDriverDetails(id);
      }
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت وضعیت راننده');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: DriverStatus) => {
    setActionLoading(true);
    try {
      await api.updateDriverStatus(id, newStatus);
      await fetchDrivers();
      if (selectedDriverId === id) {
        await loadDriverDetails(id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: DriverStatus) => {
    switch (status) {
      case 'ONLINE':
        return <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">آنلاین (آماده)</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">در حال سفر</span>;
      case 'OFFLINE':
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">آفلاین</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold animate-pulse">در انتظار تأیید</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">مسدود</span>;
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">تأیید شده</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">مدیریت رانندگان و ناوگان</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تأیید مدارک، پایش وضعیت آنلاین/آفلاین و حسابداری کمیسیون رانندگان
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'همه رانندگان' },
            { id: 'PENDING', label: 'در انتظار تأیید' },
            { id: 'ONLINE', label: 'آنلاین' },
            { id: 'BUSY', label: 'در سفر' },
            { id: 'OFFLINE', label: 'آفلاین' },
            { id: 'SUSPENDED', label: 'مسدود' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام، موبایل، کد ملی یا پلاک..."
            className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className={`p-4 rounded-xl bg-white border transition shadow-xs flex flex-col justify-between gap-3 ${
              driver.status === 'PENDING' ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-700 font-bold text-xs">
                    {driver.avatar ? (
                      <img src={driver.avatar} alt={driver.full_name} className="w-full h-full object-cover" />
                    ) : (
                      driver.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{driver.full_name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono text-teal-700">{driver.mobile}</span>
                      <span>•</span>
                      <span>کد ملی: {driver.national_code}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(driver.status)}
              </div>

              {/* Vehicle & Plate details */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Car className="w-3.5 h-3.5 text-teal-600" />
                  <span>{driver.car_name || 'بدون خودرو'}</span>
                  <span className="text-slate-400 text-[10px]">({driver.car_color || 'سفید'})</span>
                </div>
                <span className="font-mono font-bold text-slate-800 text-[11px]">
                  {driver.license_plate || 'پلاک ثبت نشده'}
                </span>
              </div>

              {/* Financial Wallet & Trips */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">سفرهای انجام شده:</span>
                  <span className="font-bold text-slate-800">{driver.completed_trips} سفر</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">کیف پول راننده:</span>
                  <span className={`font-bold font-mono text-[11px] ${
                    (driver.wallet_balance ?? 150000) < 50000
                      ? 'text-rose-600'
                      : (driver.wallet_balance ?? 150000) < 100000
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}>
                    {((driver.wallet_balance ?? 150000) / 1000).toLocaleString('fa-IR')} ه.ت
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              {driver.status === 'PENDING' ? (
                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => handleVerifyDriver(driver.id, 'ACTIVE')}
                    disabled={actionLoading}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>تأیید مدارک (پیامک فعال‌سازی)</span>
                  </button>
                  <button
                    onClick={() => handleVerifyDriver(driver.id, 'REJECTED')}
                    disabled={actionLoading}
                    className="py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200"
                  >
                    رد مدارک
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => loadDriverDetails(driver.id)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition text-center"
                  >
                    مشاهده پرونده کامل
                  </button>
                  {driver.status === 'SUSPENDED' ? (
                    <button
                      onClick={() => handleUpdateStatus(driver.id, 'ACTIVE')}
                      className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs hover:bg-green-100 transition font-medium"
                      title="فعال‌سازی مجدد"
                    >
                      رفع انسداد
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(driver.id, 'SUSPENDED')}
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs hover:bg-red-100 transition font-medium"
                      title="مسدودسازی حساب راننده"
                    >
                      مسدود
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {drivers.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs shadow-xs">
          هیچ راننده‌ای با مشخصات جستجو شده یافت نشد.
        </div>
      )}

      {/* Driver Detail Drawer / Modal */}
      {selectedDriverId && driverDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-xs">
                  پرونده راننده: {driverDetails.driver.full_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedDriverId(null);
                  setDriverDetails(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Profile Bar */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{driverDetails.driver.full_name}</div>
                  <div className="text-slate-500 font-mono mt-0.5">{driverDetails.driver.mobile}</div>
                </div>
                {getStatusBadge(driverDetails.driver.status)}
              </div>

              {/* Personal Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-xs">
                  اطلاعات هویتی و سکونت
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>کد ملی: <span className="font-mono text-slate-800 font-bold">{driverDetails.driver.national_code}</span></div>
                  <div>تاریخ تولد: <span className="text-slate-800">{driverDetails.driver.birth_date || 'نامشخص'}</span></div>
                  <div>تماس اضطراری: <span className="font-mono text-slate-800">{driverDetails.driver.emergency_contact || '-'}</span></div>
                  <div>امتیاز راننده: <span className="text-amber-500 font-bold">★ {driverDetails.driver.rating}</span></div>
                  <div className="col-span-2">آدرس: <span className="text-slate-800">{driverDetails.driver.address || 'پردیس'}</span></div>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-xs">
                  مشخصات خودرو
                </h4>
                {driverDetails.vehicles.map((v: any) => (
                  <div key={v.id} className="flex justify-between items-center text-slate-600">
                    <span>{v.car_name} ({v.color})</span>
                    <span className="font-mono text-slate-800 font-bold">{v.license_plate}</span>
                  </div>
                ))}
              </div>

              {/* Documents Status */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-xs">
                  مدارک بارگذاری شده
                </h4>
                <div className="space-y-1.5 text-[11px] text-teal-700">
                  <div className="flex items-center gap-1.5"><FileCheck2 className="w-3.5 h-3.5 text-teal-600" /> گواهینامه رانندگی معتبر</div>
                  <div className="flex items-center gap-1.5"><FileCheck2 className="w-3.5 h-3.5 text-teal-600" /> کارت خودرو / برگ سبز</div>
                  <div className="flex items-center gap-1.5"><FileCheck2 className="w-3.5 h-3.5 text-teal-600" /> بیمه‌نامه شخص ثالث معتبر</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedDriverId(null);
                  setDriverDetails(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
