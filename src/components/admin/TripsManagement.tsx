import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trip, Driver, TripStatus } from '../../types';
import {
  Car,
  Search,
  CheckCircle2,
  XCircle,
  UserPlus,
  X,
} from 'lucide-react';

export const TripsManagement: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [assignModalTrip, setAssignModalTrip] = useState<Trip | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const [tripsData, driversData] = await Promise.all([
        api.getTrips({ status: statusFilter, search }),
        api.getDrivers({ status: 'ALL' }),
      ]);
      setTrips(tripsData);
      setDrivers(driversData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter, search]);

  const handleAssignDriver = async () => {
    if (!assignModalTrip || !selectedDriverId) return;
    try {
      await api.assignTrip(assignModalTrip.id, Number(selectedDriverId));
      setAssignModalTrip(null);
      setSelectedDriverId('');
      await fetchTrips();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (tripId: number, status: TripStatus) => {
    try {
      await api.updateTripStatus(tripId, status);
      await fetchTrips();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">درخواست جدید</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">تخصیص یافته</span>;
      case 'ACCEPTED':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">پذیرفته توسط راننده</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold animate-pulse">در مسیر (فعال)</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">تکمیل شده</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">لغو شده</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-800">مدیریت و پایش سفرهای آژانس</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          مشاهده، تخصیص دستی راننده، تغییر وضعیت و محاسبه خودکار کمیسیون
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'همه' },
            { id: 'REQUESTED', label: 'درخواست جدید' },
            { id: 'ASSIGNED', label: 'تخصیص یافته' },
            { id: 'IN_PROGRESS', label: 'در حال انجام' },
            { id: 'COMPLETED', label: 'تکمیل شده' },
            { id: 'CANCELLED', label: 'لغو شده' },
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
            placeholder="شماره سفر، نام مسافر، شماره یا مسیر..."
            className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Trips Table / List */}
      <div className="space-y-3">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
          >
            {/* Trip Info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-teal-700 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {trip.trip_number}
                </span>
                {getStatusBadge(trip.status)}
                {trip.is_night_shift === 1 && (
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                    شیفت شب
                  </span>
                )}
                <span className="text-slate-400 text-[11px] mr-auto sm:mr-0">
                  {trip.trip_date} - ساعت {trip.trip_time}
                </span>
              </div>

              {/* Customer & Route */}
              <div className="flex flex-wrap items-center gap-2 text-slate-700">
                <span className="font-bold text-slate-800">{trip.customer_name}</span>
                <span className="text-slate-400 font-mono">({trip.customer_phone})</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">از «{trip.origin}»</span>
                <span className="text-slate-400">←</span>
                <span className="text-slate-600">به «{trip.destination}»</span>
              </div>

              {/* Driver and Vehicle */}
              <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                {trip.driver_name ? (
                  <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                    <Car className="w-3.5 h-3.5 text-teal-600" />
                    <span>راننده: {trip.driver_name}</span>
                    <span className="font-mono text-slate-600">({trip.car_name} - {trip.license_plate})</span>
                  </div>
                ) : (
                  <span className="text-orange-600 font-semibold">هنوز راننده‌ای تخصیص داده نشده</span>
                )}
              </div>
            </div>

            {/* Financial Breakdown & Actions */}
            <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">
                  {trip.price.toLocaleString('fa-IR')} <span className="text-[11px] font-normal text-slate-400">تومان</span>
                </div>
                <div className="text-[10px] text-slate-400 space-x-2 space-x-reverse mt-0.5">
                  <span className="text-green-600 font-semibold">سهم راننده: {trip.driver_share.toLocaleString('fa-IR')}</span>
                  <span>|</span>
                  <span className="text-teal-600 font-semibold">کمیسیون: {trip.commission.toLocaleString('fa-IR')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {trip.status === 'REQUESTED' && (
                  <button
                    onClick={() => {
                      setAssignModalTrip(trip);
                      setSelectedDriverId('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>تخصیص راننده</span>
                  </button>
                )}

                {['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(trip.status) && (
                  <button
                    onClick={() => handleUpdateStatus(trip.id, 'COMPLETED')}
                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ثبت اتمام سفر</span>
                  </button>
                )}

                {trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleUpdateStatus(trip.id, 'CANCELLED')}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition"
                    title="لغو سفر"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {trips.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs shadow-xs">
            هیچ سفری در این وضعیت یافت نشد.
          </div>
        )}
      </div>

      {/* Manual Driver Assignment Modal */}
      {assignModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-xs">تخصیص راننده به سفر {assignModalTrip.trip_number}</h3>
              <button onClick={() => setAssignModalTrip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>مسافر: <span className="font-bold text-slate-800">{assignModalTrip.customer_name}</span></div>
              <div>مسیر: {assignModalTrip.origin} ← {assignModalTrip.destination}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">انتخاب راننده ناوگان:</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">-- یک راننده انتخاب نمایید --</option>
                {drivers
                  .filter((d) => ['ONLINE', 'ACTIVE', 'BUSY'].includes(d.status))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.car_name} - {d.license_plate}) [{d.status === 'ONLINE' ? 'آماده' : d.status}]
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setAssignModalTrip(null)}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                تأیید و واگذاری سفر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
