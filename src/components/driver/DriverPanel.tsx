import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Trip, DriverStatus, DriverLedgerEntry, NightShift, WalletInfo } from '../../types';
import { ReceiptModal } from '../common/ReceiptModal';
import { ProfilePhotoModal } from './ProfilePhotoModal';
import {
  Car,
  Power,
  CheckCircle2,
  PhoneCall,
  MapPin,
  CreditCard,
  Moon,
  Navigation,
  FileText,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  Smartphone,
  Compass,
  Camera,
} from 'lucide-react';

export const DriverPanel: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('ONLINE');
  const [assignedTrips, setAssignedTrips] = useState<Trip[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<DriverLedgerEntry[]>([]);
  const [myShifts, setMyShifts] = useState<NightShift[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Profile Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);

  // GPS Tracking State
  const [isGpsActive, setIsGpsActive] = useState<boolean>(true);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string>('متصل به ماهواره GPS');

  // Zarinpal Wallet Topup State
  const [isTopupModalOpen, setIsTopupModalOpen] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [isProcessingTopup, setIsProcessingTopup] = useState<boolean>(false);
  const [topupSuccessMsg, setTopupSuccessMsg] = useState<string | null>(null);

  // Online Payment State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const loadDriverData = async () => {
    try {
      const drivers = await api.getDrivers({ status: 'ALL' });
      const current =
        drivers.find((d) => d.user_id === user?.id || d.mobile === user?.mobile) || drivers[0];

      if (current) {
        const [details, trips, ledger, shifts, wallet] = await Promise.all([
          api.getDriver(current.id),
          api.getTrips(),
          api.getDriverLedger(current.id),
          api.getNightShifts(),
          api.getDriverWallet(current.id),
        ]);

        setDriverProfile(details);
        setDriverStatus(details.driver.status);
        setWalletInfo(wallet);
        setAssignedTrips(
          trips.filter((t) => t.driver_id === current.id && ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status))
        );
        setLedgerEntries(ledger.entries || []);
        setMyShifts(shifts.filter((s) => s.driver_id === current.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 6000);
    return () => clearInterval(interval);
  }, [user]);

  // GPS Continuous Tracker
  useEffect(() => {
    if (!isGpsActive || !driverProfile?.driver?.id) return;

    const sendLocationUpdate = async (lat: number, lng: number) => {
      try {
        await api.updateDriverLocation(driverProfile.driver.id, {
          lat,
          lng,
          bearing: Math.floor(Math.random() * 360),
        });
        setGpsCoords({ lat, lng });
        setGpsStatusText('مختصات به مرکز مخابره شد');
      } catch (err) {
        console.error('GPS update failed:', err);
      }
    };

    // Try HTML5 Geolocation API
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          sendLocationUpdate(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback simulation in Bahrami village, Khorramabad
          const baseLat = 33.4360;
          const baseLng = 48.3610;
          sendLocationUpdate(baseLat + (Math.random() - 0.5) * 0.005, baseLng + (Math.random() - 0.5) * 0.005);
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } else {
      const timer = setInterval(() => {
        const baseLat = 33.4360;
        const baseLng = 48.3610;
        sendLocationUpdate(baseLat + (Math.random() - 0.5) * 0.005, baseLng + (Math.random() - 0.5) * 0.005);
      }, 10000);
      return () => clearInterval(timer);
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isGpsActive, driverProfile?.driver?.id]);

  const toggleOnlineStatus = async () => {
    if (!driverProfile?.driver?.id) return;
    const newStatus: DriverStatus = driverStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await api.updateDriverStatus(driverProfile.driver.id, newStatus);
      setDriverStatus(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTripAction = async (tripId: number, nextStatus: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await api.updateTripStatus(tripId, nextStatus);
      await loadDriverData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleZarinpalTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverProfile?.driver?.id || topupAmount < 10000) return;

    try {
      setIsProcessingTopup(true);
      const res = await api.topupDriverWallet(driverProfile.driver.id, {
        amount: topupAmount,
        gateway_name: 'ZARINPAL_SHAPARAK',
        card_pan: '۶۰۳۷-۹۹**-****-۵۴۲۱',
      });

      setTopupSuccessMsg(`تراکنش زرین‌پال با موفقیت تایید شد. مبلغ ${topupAmount.toLocaleString('fa-IR')} تومان به موجودی کیف پول اضافه شد. کد پیگیری: ${res.reference_number}`);
      await loadDriverData();
      setTimeout(() => {
        setIsTopupModalOpen(false);
        setTopupSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'خطا در افزایش اعتبار');
    } finally {
      setIsProcessingTopup(false);
    }
  };

  const handleSaveAvatar = async (avatarDataUrl: string) => {
    if (!driverProfile?.driver?.id) return;
    await api.updateDriverAvatar(driverProfile.driver.id, avatarDataUrl);
    await loadDriverData();
    await refreshProfile();
  };

  const activeTrip = assignedTrips[0];
  const tonightShift = myShifts.find((s) => s.status === 'SCHEDULED' || s.status === 'ACTIVE');

  // Wallet balance thresholds
  const currentBalance = walletInfo?.balance ?? (driverProfile?.driver?.wallet_balance ?? 150000);
  const isBlocked = currentBalance < 50000;
  const isWarning = currentBalance >= 50000 && currentBalance < 100000;

  const currentAvatarUrl = driverProfile?.driver?.avatar || user?.avatar;

  return (
    <div className="space-y-5 max-w-4xl mx-auto select-none p-2 sm:p-4">
      {/* 1. Header Profile & GPS Tracker */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-right">
          {/* Driver Avatar with click-to-upload */}
          <div
            onClick={() => setIsPhotoModalOpen(true)}
            className="relative w-14 h-14 rounded-2xl ring-2 ring-teal-500/30 overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer group shadow-sm shrink-0 transition hover:ring-teal-500 active:scale-95"
            title="کلیک برای تغییر عکس پروفایل"
          >
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={driverProfile?.driver?.full_name || 'راننده'}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
              />
            ) : (
              <div className="w-full h-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-2xl border border-teal-200">
                🚕
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <Camera className="w-5 h-5 drop-shadow" />
            </div>
            <div className="absolute bottom-0 right-0 bg-teal-600 text-white p-1 rounded-tl-lg shadow">
              <Camera className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h2 className="text-sm font-bold text-slate-800">{driverProfile?.driver?.full_name}</h2>
              <span className="text-amber-500 text-xs font-mono font-bold">★ {driverProfile?.driver?.rating}</span>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-teal-50 hover:bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200 transition"
              >
                <Camera className="w-3 h-3 text-teal-600" />
                <span>ویرایش عکس</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              خودرو: {driverProfile?.vehicles?.[0]?.car_name || 'پژو پارس'} | پلاک:{' '}
              <span className="font-mono text-slate-700 font-bold">
                {driverProfile?.vehicles?.[0]?.license_plate || 'ایران ۲۲'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Online/Offline Button */}
          <button
            onClick={toggleOnlineStatus}
            disabled={isBlocked}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs active:scale-95 cursor-pointer ${
              isBlocked
                ? 'bg-rose-100 text-rose-700 cursor-not-allowed border border-rose-300'
                : driverStatus === 'ONLINE'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {isBlocked
                ? 'حساب مسدود (کسری کیف پول)'
                : driverStatus === 'ONLINE'
                ? 'آماده‌باش و آنلاین'
                : 'آفلاین'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Wallet Balance Indicator & Zarinpal Topup Card (SECTION 8.2) */}
      <div className={`p-5 rounded-2xl border shadow-sm transition ${
        isBlocked
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isBlocked ? 'bg-rose-200 text-rose-700' : isWarning ? 'bg-amber-200 text-amber-700' : 'bg-teal-50 text-teal-600'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">موجودی کیف پول راننده</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black font-mono">
                  {currentBalance.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs">تومان</span>
                {isBlocked && (
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                    حساب مسدود است
                  </span>
                )}
                {isWarning && (
                  <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                    هشدار کمبود موجودی
                  </span>
                )}
                {!isBlocked && !isWarning && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    موجودی کافی و فعال
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Topup Button */}
          <button
            onClick={() => setIsTopupModalOpen(true)}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>شارژ آنلاین کیف پول (زرین‌پال)</span>
          </button>
        </div>

        {isBlocked && (
          <div className="mt-3 text-xs bg-rose-100/80 p-2.5 rounded-xl border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              جهت فعال‌سازی حساب و دریافت مجدد سرویس، موجودی کیف پول باید حداقل ۵۰,۰۰۰ تومان باشد. لطفاً اقدام به شارژ نمایید.
            </span>
          </div>
        )}
      </div>

      {/* 3. GPS Tracker Indicator */}
      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Navigation className={`w-4 h-4 ${isGpsActive ? 'text-teal-600 animate-spin' : 'text-slate-400'}`} />
          <span className="font-medium">ردیاب موقعیت لحظه‌ای راننده (GPS):</span>
          <span className="font-bold text-slate-800">{gpsStatusText}</span>
        </div>
        {gpsCoords && (
          <span className="font-mono text-[10px] text-slate-400">
            {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Tonight Shift Alert */}
      {tonightShift && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 text-xs text-indigo-900 shadow-xs">
          <Moon className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold block">شما امشب راننده کشیک شبانه هستید!</span>
            <span className="text-indigo-700 text-[11px]">
              ساعت مأموریت: {tonightShift.start_time} الی {tonightShift.end_time} | نرخ کرایه‌ها در شیفت شب شامل +۲۰٪
              حق‌الزحمه است.
            </span>
          </div>
        </div>
      )}

      {/* Active Trip Card */}
      {activeTrip ? (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 border-r-4 border-r-teal-600">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
              <h3 className="font-bold text-slate-800 text-sm">سفر جاری واگذارشده به شما</h3>
              <span className="font-mono text-teal-700 font-bold text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {activeTrip.trip_number}
              </span>
            </div>
            <div className="text-left">
              <span className="text-base font-black text-slate-900 font-mono">
                {activeTrip.price.toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>

          {/* Passenger Details & Call */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">مشخصات مسافر:</span>
              <span className="font-bold text-slate-800 text-xs">{activeTrip.customer_name}</span>
            </div>
            <a
              href={`tel:${activeTrip.customer_phone}`}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>تماس با مسافر ({activeTrip.customer_phone})</span>
            </a>
          </div>

          {/* Origin & Destination */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block">مبدأ حرکت مسافر:</span>
                <span className="text-slate-800 font-medium">{activeTrip.origin}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block">مقصد مسافر:</span>
                <span className="text-slate-800 font-medium">{activeTrip.destination}</span>
              </div>
            </div>
          </div>

          {/* Trip Workflow Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            {activeTrip.status === 'ASSIGNED' && (
              <button
                onClick={() => handleTripAction(activeTrip.id, 'ACCEPTED')}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>قبول درخواست سفر</span>
              </button>
            )}

            {activeTrip.status === 'ACCEPTED' && (
              <button
                onClick={() => handleTripAction(activeTrip.id, 'IN_PROGRESS')}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
              >
                <Car className="w-4 h-4" />
                <span>رسیدم به مسافر / شروع سفر</span>
              </button>
            )}

            {activeTrip.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleTripAction(activeTrip.id, 'COMPLETED')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>پایان سفر و دریافت کرایه (کسر ۱۵٪ کمیسیون)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs text-center text-slate-500 space-y-2">
          <Car className="w-8 h-8 text-teal-600/50 mx-auto" />
          <h4 className="font-bold text-slate-800 text-xs">سفر فعالی برای شما واگذار نشده است</h4>
          <p className="text-[11px] text-slate-400">
            وضعیت خود را روی «آماده‌باش و آنلاین» قرار دهید تا سفرهای جدید به شما اعزام شود.
          </p>
        </div>
      )}

      {/* Ledger Transactions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-teal-600" />
          <span>ریز تراکنش‌های اخیر کیف پول و کمیسیون</span>
        </h4>
        <div className="space-y-2 text-xs max-h-56 overflow-y-auto">
          {ledgerEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-slate-800">{entry.description}</span>
                <div className="text-[10px] text-slate-400 font-mono">{entry.created_at}</div>
              </div>
              <div className="text-left">
                <span
                  className={`font-mono font-bold ${
                    entry.type === 'COMMISSION_DEBT' ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {entry.type === 'COMMISSION_DEBT' ? '-' : '+'}
                  {entry.amount.toLocaleString('fa-IR')} ت
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  مانده: {entry.balance_after.toLocaleString('fa-IR')} ت
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zarinpal Top-up Modal */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-900">
                  زرین
                </div>
                <div>
                  <h3 className="font-bold text-sm">درگاه پرداخت اینترنتی زرین‌پال</h3>
                  <p className="text-xs text-slate-400">شارژ آنلاین کیف پول راننده</p>
                </div>
              </div>
              <button onClick={() => setIsTopupModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {topupSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <p className="font-bold text-xs text-slate-800 leading-relaxed">{topupSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleZarinpalTopup} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-2">انتخاب سریع مبلغ شارژ:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopupAmount(amt)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition font-mono ${
                          topupAmount === amt
                            ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {amt.toLocaleString('fa-IR')} تومان
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">یا مبلغ دلخواه (تومان):</label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 font-mono font-bold text-left text-teal-700"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>پذیرنده:</span>
                    <span className="font-bold text-slate-700">سامانه هوشمند تاکسی پردیس</span>
                  </div>
                  <div className="flex justify-between">
                    <span>شماره ترمینال شاپرک:</span>
                    <span className="font-mono">PRD-9482104</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={isProcessingTopup}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{isProcessingTopup ? 'در حال انتقال به شاپرک...' : `پرداخت و شارژ ${topupAmount.toLocaleString('fa-IR')} تومان`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTopupModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Driver Profile Photo Upload Modal */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentAvatar={currentAvatarUrl}
        driverName={driverProfile?.driver?.full_name || user?.full_name}
        onSave={handleSaveAvatar}
      />
    </div>
  );
};
