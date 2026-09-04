import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { api } from '../../services/api';
import { FleetDriver, PointOfInterest, Customer } from '../../types';
import {
  Car,
  Navigation,
  RefreshCw,
  Phone,
  Star,
  Wallet,
  Play,
  Pause,
  MapPin,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Compass,
  Award,
  Search,
} from 'lucide-react';

interface FleetLiveMapProps {
  onDispatchToDriver?: (driverId: number, driverName: string) => void;
}

export const FleetLiveMap: React.FC<FleetLiveMapProps> = ({ onDispatchToDriver }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDriver, setSelectedDriver] = useState<FleetDriver | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Dispatch modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [subCodeInput, setSubCodeInput] = useState('');
  const [subCodeLoading, setSubCodeLoading] = useState(false);
  const [subCodeError, setSubCodeError] = useState('');
  const [selectedSubCustomer, setSelectedSubCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tripOrigin, setTripOrigin] = useState('روستای بهرامی (دفتر تاکسی‌سرویس)');
  const [tripDestination, setTripDestination] = useState('خرم‌آباد، میدان شهدا');
  const [tripPrice, setTripPrice] = useState(70000);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubLookup = async (code?: string) => {
    const raw = (code || subCodeInput).trim();
    if (!raw) return;
    setSubCodeLoading(true);
    setSubCodeError('');
    try {
      const cust = await api.getCustomerByCode(raw);
      if (cust) {
        setSelectedSubCustomer(cust);
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        if (cust.address) setTripOrigin(cust.address);
        if (cust.default_destination) setTripDestination(cust.default_destination);
        if (cust.discount_percent > 0) {
          setTripPrice((prev) => Math.max(20000, Math.round(prev * (1 - cust.discount_percent / 100))));
        }
      }
    } catch (err: any) {
      setSubCodeError(err.message || 'مشترک یافت نشد');
    } finally {
      setSubCodeLoading(false);
    }
  };

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [fleetData, poiData] = await Promise.all([api.getLiveFleet(), api.getPois()]);
      setDrivers(fleetData);
      setPois(poiData);
      setLastSyncTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Error loading live fleet:', err);
      setErrorMessage(err?.message || 'خطایی در برقراری ارتباط با سرور رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Khorramabad & Bahrami Village
    const map = L.map(mapContainerRef.current, {
      center: [33.450, 48.358],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | تاکسی سرویس بهرامی خرم‌آباد',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    fetchFleetData();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers on Drivers / POIs / Filter change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // 1. Add POIs
    pois.forEach((poi) => {
      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="
            background: #0f172a;
            color: #f8fafc;
            border: 2px solid #38bdf8;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            font-family: 'Vazirmatn', sans-serif;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>📍</span>
            <span>${poi.name}</span>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15],
      });

      const poiMarker = L.marker([poi.lat, poi.lng], { icon: poiIcon });
      poiMarker.bindPopup(`
        <div style="direction: rtl; font-family: 'Vazirmatn', sans-serif; text-align: right; padding: 4px;">
          <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #0f172a;">${poi.name}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${poi.address || poi.category}</p>
          <div style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">
            نرخ ثابت: ${poi.fixed_price ? poi.fixed_price.toLocaleString('fa-IR') + ' تومان' : 'محاسبه متری'}
          </div>
        </div>
      `);
      markersLayerRef.current?.addLayer(poiMarker);
    });

    // 2. Filter & Add Drivers
    const filteredDrivers = drivers.filter((d) => {
      if (filterStatus === 'ONLINE') return d.status === 'ONLINE';
      if (filterStatus === 'BUSY') return d.status === 'BUSY';
      return true;
    });

    filteredDrivers.forEach((driver) => {
      const isOnline = driver.status === 'ONLINE';
      const isBusy = driver.status === 'BUSY';
      const ringColor = isOnline ? '#10b981' : isBusy ? '#f59e0b' : '#94a3b8';
      const bgColor = isOnline ? '#065f46' : isBusy ? '#92400e' : '#334155';

      const driverIcon = L.divIcon({
        className: 'custom-driver-marker',
        html: `
          <div style="
            position: relative;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: ${ringColor};
              opacity: 0.35;
              animation: ${isOnline ? 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'};
            "></div>
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: ${bgColor};
              border: 2px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 16px;
              cursor: pointer;
            ">
              🚕
            </div>
            <div style="
              position: absolute;
              bottom: -18px;
              background: #0f172a;
              color: white;
              font-size: 9px;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
              white-space: nowrap;
              font-family: 'Vazirmatn', sans-serif;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            ">
              ${driver.full_name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([driver.lat, driver.lng], { icon: driverIcon });

      marker.on('click', () => {
        setSelectedDriver(driver);
        mapInstanceRef.current?.panTo([driver.lat, driver.lng], { animate: true });
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [drivers, pois, filterStatus]);

  // Live Simulation loop (moves drivers realistically across Pardis streets)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.status !== 'ONLINE' && d.status !== 'BUSY') return d;
          // Slight jitter/movement
          const deltaLat = (Math.random() - 0.48) * 0.0012;
          const deltaLng = (Math.random() - 0.48) * 0.0012;
          const newLat = d.lat + deltaLat;
          const newLng = d.lng + deltaLng;
          return {
            ...d,
            lat: newLat,
            lng: newLng,
            bearing: Math.round(Math.random() * 360),
            last_location_time: 'هم‌اکنون (لحظه‌ای)',
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleJumpTo = (lat: number, lng: number, zoom = 14) => {
    mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 });
  };

  const handleDirectDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    try {
      const res = await api.createTrip({
        customer_id: selectedSubCustomer ? selectedSubCustomer.id : undefined,
        subscription_code: selectedSubCustomer ? selectedSubCustomer.subscription_code : subCodeInput.trim() || undefined,
        customer_name: customerName,
        customer_phone: customerPhone,
        origin: tripOrigin,
        destination: tripDestination,
        driver_id: selectedDriver.id,
        price: tripPrice,
        service_type: 'استاندارد',
        notes: `اعزام اختصاصی از روی نقشه به ${selectedDriver.full_name}${selectedSubCustomer ? ` (مشترک پر سفر کد ${selectedSubCustomer.subscription_code})` : ''}`,
      });

      setDispatchSuccess(`سفر ${res.trip_number} با موفقیت به ${selectedDriver.full_name} اعزام شد و پیامک برای راننده ارسال گردید.`);
      setTimeout(() => {
        setIsDispatchModalOpen(false);
        setDispatchSuccess(null);
        setSelectedSubCustomer(null);
        setSubCodeInput('');
        fetchFleetData();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سفر');
    }
  };

  const onlineCount = drivers.filter((d) => d.status === 'ONLINE').length;
  const busyCount = drivers.filter((d) => d.status === 'BUSY').length;
  const offlineCount = drivers.filter((d) => d.status === 'OFFLINE' || d.status === 'ACTIVE').length;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row relative bg-slate-100 overflow-hidden select-none">
      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="absolute top-16 right-4 left-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-[1100] bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 text-xs">
          <span>{errorMessage}</span>
          <button
            onClick={fetchFleetData}
            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
          >
            تلاش مجدد
          </button>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Control Overlay Header */}
      <div className="absolute top-3 right-3 left-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* KPI Badges */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 pointer-events-auto">
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">ناوگان زنده:</span>
            <span className="text-xs font-black text-emerald-600">{drivers.length} خودرو</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {onlineCount} آنلاین و آزاد
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {busyCount} در سفر
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {offlineCount} آفلاین
            </span>
          </div>
        </div>

        {/* Action Controls & Simulation */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-200 pointer-events-auto">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setFilterStatus('ONLINE')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filterStatus === 'ONLINE' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              فقط آزاد
            </button>
            <button
              onClick={() => setFilterStatus('BUSY')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filterStatus === 'BUSY' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              در حال سفر
            </button>
          </div>

          {/* Real-time simulation button */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
            }`}
            title="شبیه‌سازی حرکت زنده‌ی خودروهای پردیس روی نقشه"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'توقف شبیه‌سازی GPS' : 'شبیه‌سازی زنده حرکت'}</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={fetchFleetData}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            title={`همگام‌سازی آخرین موقعیت (${lastSyncTime})`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Fast Locations Bar (Bottom Center) */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs border border-slate-700 shadow-xl overflow-x-auto max-w-[90vw]">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          پرش سریع:
        </span>
        <button
          onClick={() => handleJumpTo(33.436, 48.361, 15)}
          className="px-2 py-0.5 rounded bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold transition shrink-0"
        >
          روستای بهرامی (مقر آژانس)
        </button>
        <button
          onClick={() => handleJumpTo(33.444, 48.358, 14)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition shrink-0"
        >
          ماسور و فرودگاه
        </button>
        <button
          onClick={() => handleJumpTo(33.468, 48.352, 14)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition shrink-0"
        >
          میدان شقایق و گلدشت
        </button>
        <button
          onClick={() => handleJumpTo(33.486, 48.354, 14)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition shrink-0"
        >
          سبزه‌میدان و قلعه فلک‌الافلاک
        </button>
        <button
          onClick={() => handleJumpTo(33.504, 48.352, 14)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition shrink-0"
        >
          میدان و دریاچه کیو
        </button>
        <button
          onClick={() => handleJumpTo(33.525, 48.359, 14)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition shrink-0"
        >
          دره‌گرم و فلک‌الدین
        </button>
        <button
          onClick={() => handleJumpTo(33.465, 48.420, 14)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition shrink-0"
        >
          سایت کمالوند (دانشگاه‌ها)
        </button>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Driver Detail Drawer / Card (When a marker is clicked) */}
      {selectedDriver && (
        <div className="absolute top-16 right-3 w-80 max-w-[90vw] z-[1001] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                {selectedDriver.avatar ? (
                  <img src={selectedDriver.avatar} alt={selectedDriver.full_name} className="w-full h-full object-cover" />
                ) : (
                  '🚕'
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{selectedDriver.full_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedDriver.status === 'ONLINE'
                        ? 'bg-emerald-400'
                        : selectedDriver.status === 'BUSY'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {selectedDriver.status === 'ONLINE'
                      ? 'آنلاین و آماده اعزام'
                      : selectedDriver.status === 'BUSY'
                      ? 'در حال انجام سفر'
                      : 'آفلاین'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedDriver(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs text-slate-700">
            {/* Vehicle & Plate */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">{selectedDriver.car_name || 'خودروی ثبت‌شده'}</span>
                <span className="text-slate-400">({selectedDriver.car_color || 'سفید'})</span>
              </div>
              <span className="font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                {selectedDriver.license_plate || 'ایران ۲۲'}
              </span>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium">امتیاز</p>
                <p className="font-bold text-amber-600 flex items-center justify-center gap-0.5 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {selectedDriver.rating}
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium">سفرهای انجام‌شده</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedDriver.completed_trips}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium">کیف پول</p>
                <p className={`font-bold mt-0.5 ${selectedDriver.wallet_balance < 50000 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {((selectedDriver.wallet_balance ?? 150000) / 1000).toLocaleString('fa-IR')} ه.ت
                </p>
              </div>
            </div>

            {/* Contact & GPS Details */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-500">
                <span>تلفن راننده:</span>
                <a href={`tel:${selectedDriver.mobile}`} className="font-mono text-teal-700 font-bold hover:underline">
                  {selectedDriver.mobile}
                </a>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>موقعیت جغرافیایی:</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {selectedDriver.lat.toFixed(4)}, {selectedDriver.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                disabled={selectedDriver.status !== 'ONLINE'}
                onClick={() => {
                  if (onDispatchToDriver) {
                    onDispatchToDriver(selectedDriver.id, selectedDriver.full_name);
                  } else {
                    setCustomerName('مسافر پردیس');
                    setCustomerPhone('0912');
                    setIsDispatchModalOpen(true);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition shadow-xs ${
                  selectedDriver.status === 'ONLINE'
                    ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>اعزام مستقیم سفر به این راننده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Dispatch Modal */}
      {isDispatchModalOpen && selectedDriver && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white">
                  📞
                </div>
                <div>
                  <h3 className="font-bold text-sm">اعزام مستقیم سفر تلفنی</h3>
                  <p className="text-xs text-slate-400">به راننده: {selectedDriver.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {dispatchSuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <p className="font-bold text-sm text-slate-800">{dispatchSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleDirectDispatch} className="p-5 space-y-3.5 text-xs">
                {/* Subscription Code Lookup */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold flex items-center gap-1.5 text-[11px]">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>کد اشتراک مسافر پر سفر (ورود خودکار):</span>
                    </label>
                    {selectedSubCustomer && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        مشترک تأیید شد
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={subCodeInput}
                      onChange={(e) => {
                        setSubCodeInput(e.target.value);
                        if (e.target.value.trim().length >= 3) {
                          handleSubLookup(e.target.value.trim());
                        }
                      }}
                      placeholder="کد اشتراک (مثال: ۱۰۱، ۱۰۲، ۱۰۳...)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubLookup()}
                      disabled={subCodeLoading}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition disabled:opacity-50"
                    >
                      {subCodeLoading ? '...' : 'استعلام'}
                    </button>
                  </div>
                  {subCodeError && (
                    <p className="text-[10px] text-rose-600">{subCodeError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام مسافر:</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                    placeholder="مثال: آقای حسینی"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">شماره تماس مسافر:</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-left font-mono"
                    placeholder="09123456789"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">مبدأ حرکت:</label>
                  <input
                    type="text"
                    required
                    value={tripOrigin}
                    onChange={(e) => setTripOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">مقصد مسافر:</label>
                  <input
                    type="text"
                    required
                    value={tripDestination}
                    onChange={(e) => setTripDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">کرایه توافقی/محاسبه‌شده (تومان):</label>
                  <input
                    type="number"
                    required
                    step="5000"
                    value={tripPrice}
                    onChange={(e) => setTripPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-left font-mono font-bold text-teal-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    کمیسیون آژانس: {(tripPrice * 0.15).toLocaleString('fa-IR')} تومان (۱۵٪)
                  </p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold transition active:scale-95 shadow-xs"
                  >
                    تایید و ارسال به راننده (پیامک و نوتیفیکیشن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
