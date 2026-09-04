import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { NightShift, Driver, ShiftStatus } from '../../types';
import {
  Moon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  Phone,
  ShieldAlert,
} from 'lucide-react';

export const NightShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<NightShift[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Form
  const [date, setDate] = useState<string>('1403/06/16');
  const [driverId, setDriverId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState<string>('22:00');
  const [endTime, setEndTime] = useState<string>('06:00');
  const [notes, setNotes] = useState<string>('');

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const [shiftsData, driversData] = await Promise.all([
        api.getNightShifts(),
        api.getDrivers({ status: 'ALL' }),
      ]);
      setShifts(shiftsData);
      setDrivers(driversData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!date || !driverId) {
      setError('تاریخ و راننده الزامی است.');
      return;
    }

    try {
      await api.createNightShift({
        date,
        driver_id: Number(driverId),
        start_time: startTime,
        end_time: endTime,
        notes,
      });
      setIsModalOpen(false);
      await fetchShifts();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت شیفت شب');
    }
  };

  const handleUpdateStatus = async (id: number, status: ShiftStatus) => {
    try {
      await api.updateNightShiftStatus(id, status);
      await fetchShifts();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: ShiftStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">برنامه‌ریزی شده</span>;
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold animate-pulse">در حال کشیک (فعال)</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">تکمیل شده</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">لغو شده</span>;
      case 'ABSENT':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">غیبت راننده</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">مدیریت شیفت شب و کشیک شبانه‌روزی</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            برنامه‌ریزی کشیک شب، جلوگیری سخت‌گیرانه از تداخل و ارسال اعلان خودکار به رانندگان
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setError('');
          }}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تعیین شیفت شب جدید</span>
        </button>
      </div>

      {/* Shifts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className={`p-4 rounded-xl bg-white border transition shadow-xs flex flex-col justify-between gap-3 text-xs ${
              shift.status === 'ACTIVE'
                ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>تاریخ: {shift.date}</span>
                </div>
                {getStatusBadge(shift.status)}
              </div>

              {/* Driver Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-800 text-xs">{shift.driver_name}</div>
                <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" />
                  <span>{shift.driver_phone}</span>
                </div>
                <div className="text-slate-600 text-[11px] flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>خودرو: {shift.car_name}</span>
                  <span className="font-mono text-slate-800 font-bold">{shift.license_plate}</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ساعت: {shift.start_time} الی {shift.end_time}</span>
                </span>
              </div>

              {shift.notes && (
                <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  یادداشت: {shift.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
              {shift.status === 'SCHEDULED' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(shift.id, 'ACTIVE')}
                    className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow-xs"
                  >
                    شروع کشیک
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(shift.id, 'CANCELLED')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-[11px] transition"
                  >
                    لغو
                  </button>
                </>
              )}

              {shift.status === 'ACTIVE' && (
                <button
                  onClick={() => handleUpdateStatus(shift.id, 'COMPLETED')}
                  className="w-full py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] transition flex items-center justify-center gap-1 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تکمیل و خاتمه شیفت</span>
                </button>
              )}

              {shift.status === 'COMPLETED' && (
                <span className="text-[11px] text-green-700 font-medium flex items-center gap-1 mx-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  شیفت با موفقیت انجام شد
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateShift}
            className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-5 space-y-4 text-xs text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-xs">تعیین راننده شیفت شب</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 mb-1 font-medium">تاریخ شیفت (خورشیدی) *</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="1403/06/16"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-medium">انتخاب راننده کشیک *</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              >
                <option value="">-- یک راننده انتخاب کنید --</option>
                {drivers
                  .filter((d) => ['ACTIVE', 'ONLINE', 'BUSY', 'OFFLINE'].includes(d.status))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.car_name} - {d.license_plate})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">ساعت شروع</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-medium">ساعت پایان</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-center font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-medium">دستور یا یادداشت ویژه برای راننده</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: باک بنزین کامل و آماده‌باش در میدان عدالت"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>سامانه به طور خودکار از انتخاب همزمان دو راننده در یک شب جلوگیری می‌کند.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer"
              >
                تأیید و ثبت شیفت
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
