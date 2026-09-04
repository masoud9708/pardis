import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Zone, Tariff, PointOfInterest, PricingRule } from '../../types';
import {
  MapPin,
  Plus,
  Calculator,
  Moon,
  X,
  Plane,
  Building2,
  Car,
  Compass,
  Sparkles,
  Percent,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const TariffsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POI' | 'RULES' | 'ZONES' | 'CALCULATOR'>('POI');
  const [zones, setZones] = useState<Zone[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New POI Modal
  const [isPoiModalOpen, setIsPoiModalOpen] = useState<boolean>(false);
  const [poiName, setPoiName] = useState('');
  const [poiCategory, setPoiCategory] = useState('محلات خرم‌آباد');
  const [poiAddress, setPoiAddress] = useState('');
  const [poiLat, setPoiLat] = useState('33.4360');
  const [poiLng, setPoiLng] = useState('48.3610');
  const [poiPrice, setPoiPrice] = useState('80000');

  // New Zone Modal
  const [isZoneModalOpen, setIsZoneModalOpen] = useState<boolean>(false);
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneDesc, setZoneDesc] = useState<string>('');

  // New Tariff Modal
  const [isTariffModalOpen, setIsTariffModalOpen] = useState<boolean>(false);
  const [newTariff, setNewTariff] = useState({
    origin_zone_id: '',
    destination_zone_id: '',
    base_price: '50000',
    night_price: '65000',
    holiday_price: '70000',
    commission_rate: '0.15',
  });

  // Smart Calculator State
  const [calcOrigin, setCalcOrigin] = useState('روستای بهرامی (مقر تاکسی‌سرویس)');
  const [calcDest, setCalcDest] = useState('میدان شهدا (مرکز شهر)');
  const [calcIsNight, setCalcIsNight] = useState(false);
  const [calcIsHoliday, setCalcIsHoliday] = useState(false);
  const [calcAgreedPrice, setCalcAgreedPrice] = useState<number | ''>('');
  const [calcServiceType, setCalcServiceType] = useState('استاندارد');
  const [calcResult, setCalcResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [zonesData, tariffsData, poisData, rulesData] = await Promise.all([
        api.getZones(),
        api.getTariffs(),
        api.getPois(),
        api.getPricingRules(),
      ]);
      setZones(zonesData);
      setTariffs(tariffsData);
      setPois(poisData);
      setPricingRules(rulesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runSmartCalculation = async () => {
    try {
      const res = await api.calculateSmartPrice({
        origin: calcOrigin,
        destination: calcDest,
        is_night: calcIsNight,
        is_holiday: calcIsHoliday,
        service_type: calcServiceType,
        agreed_price: calcAgreedPrice ? Number(calcAgreedPrice) : undefined,
      });
      setCalcResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runSmartCalculation();
  }, [calcOrigin, calcDest, calcIsNight, calcIsHoliday, calcServiceType, calcAgreedPrice]);

  const handleCreatePoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poiName) return;

    try {
      await api.createPoi({
        name: poiName,
        category: poiCategory,
        address: poiAddress,
        lat: Number(poiLat),
        lng: Number(poiLng),
        fixed_price: Number(poiPrice),
      });
      setIsPoiModalOpen(false);
      setPoiName('');
      setPoiAddress('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت مکان');
    }
  };

  const handleDeletePoi = async (id: number) => {
    if (!confirm('آیا از غیرفعال‌سازی این مکان شاخص اطمینان دارید؟')) return;
    try {
      await api.deletePoi(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف');
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    try {
      await api.createZone(zoneName.trim(), zoneDesc.trim());
      setZoneName('');
      setZoneDesc('');
      setIsZoneModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTariff.origin_zone_id || !newTariff.destination_zone_id || !newTariff.base_price) return;
    try {
      await api.createTariff({
        origin_zone_id: Number(newTariff.origin_zone_id),
        destination_zone_id: Number(newTariff.destination_zone_id),
        base_price: Number(newTariff.base_price),
        night_price: Number(newTariff.night_price || Math.round(Number(newTariff.base_price) * 1.2)),
        holiday_price: Number(newTariff.holiday_price || Math.round(Number(newTariff.base_price) * 1.25)),
        waiting_fee_per_min: 2500,
        stop_fee: 30000,
        extra_distance_fee_per_km: 8000,
        commission_rate: Number(newTariff.commission_rate || 0.15),
      });
      setIsTariffModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">مدیریت هوشمند نرخ‌ها، اماکن شاخص و تعرفه‌ها</h2>
          <p className="text-xs text-slate-300 mt-1">
            پیکربندی اماکن مهم (POI) با نرخ ثابت، ضرایب زمانی شب و تعطیلات، و محاسبه خودکار کرایه و کمیسیون ۱۵٪
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('POI')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'POI' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            اماکن مهم (POI)
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'RULES' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            قوانین و ضرایب
          </button>
          <button
            onClick={() => setActiveTab('ZONES')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'ZONES' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            تعرفه‌های مناطق خرم‌آباد
          </button>
          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'CALCULATOR' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            ماشین‌حساب قیمت
          </button>
        </div>
      </div>

      {/* TAB 1: POIs */}
      {activeTab === 'POI' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">اماکن و کلیه محله‌های خرم‌آباد با نرخ مصوب ثابت از مبدأ روستای بهرامی</h3>
              <p className="text-xs text-slate-400">
                کلیه محله‌های خرم‌آباد به همراه مراکز گردشگری، بیمارستان‌ها و فرودگاه با نرخ ثابت مصوب ثبت شده‌اند.
              </p>
            </div>
            <button
              onClick={() => setIsPoiModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن مکان / محله جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pois.map((poi) => (
              <div
                key={poi.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base border border-teal-100">
                      {poi.category.includes('فرودگاه') ? '✈️' : poi.category.includes('درمان') ? '🏥' : poi.category.includes('ترمینال') ? '🚌' : '📍'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{poi.name}</h4>
                      <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                        {poi.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePoi(poi.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 transition"
                    title="حذف مکان"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {poi.address || 'شهر جدید پردیس و حومه'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 text-[11px]">نرخ مصوب ثابت:</span>
                  <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {poi.fixed_price.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRICING RULES & MULTIPLIERS */}
      {activeTab === 'RULES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-teal-700">
                <Percent className="w-5 h-5" />
                <h4 className="font-bold text-sm">کمیسیون پیش‌فرض آژانس</h4>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">۱۵ ٪</p>
              <p className="text-[11px] text-slate-400">
                از هر سفر موفق به صورت خودکار از کیف پول راننده کسر می‌گردد.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-purple-700">
                <Moon className="w-5 h-5" />
                <h4 className="font-bold text-sm">ضریب شیفت شب (۲۲ تا ۰۶)</h4>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">۱.۲ × (۲۰٪ افزایش)</p>
              <p className="text-[11px] text-slate-400">
                افزایش انگیزه رانندگان کشیک شبانه جهت سرویس‌دهی ۲۴ ساعته.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-bold text-sm">ضریب تعطیلات رسمی و پیک</h4>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">۱.۲۵ × (۲۵٪ افزایش)</p>
              <p className="text-[11px] text-slate-400">
                اعمال ضریب تقاضای بالا در روزهای برفی، بارانی و تعطیل.
              </p>
            </div>
          </div>

          {/* Pricing Hierarchy Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800">اولویت‌های منطق قیمت‌گذاری سامانه (بخش ۶.۴):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-teal-700">۱. اماکن مهم (POI)</span>
                <p className="text-slate-500 text-[11px]">نرخ ثابت مصوب (فرودگاه، بیمارستان، پارک فناوری)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-teal-700">۲. مسیرهای ثابت</span>
                <p className="text-slate-500 text-[11px]">زوج مبدأ و مقصد پرتردد بین‌فازی پردیس</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-teal-700">۳. تعرفه منطقه‌ای</span>
                <p className="text-slate-500 text-[11px]">ماتریس مبدأ-مقصد فازهای ۱ تا ۱۱ پردیس</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-teal-700">۴. سفر توافقی</span>
                <p className="text-slate-500 text-[11px]">کرایه توافقی با حفظ سهم کمیسیون آژانس</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ZONES & TARIFF MATRIX */}
      {activeTab === 'ZONES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">تعرفه‌های بین‌فازی پردیس</h3>
              <p className="text-xs text-slate-400">تعرفه پایه و شبانه برای جابجایی بین مناطق شهر پردیس</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsZoneModalOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium"
              >
                + منطقه جدید
              </button>
              <button
                onClick={() => setIsTariffModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                + تعریف تعرفه بین‌فازی
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">مبدأ حرکت</th>
                    <th className="p-3.5">مقصد</th>
                    <th className="p-3.5">کرایه روز (تومان)</th>
                    <th className="p-3.5">کرایه شب (تومان)</th>
                    <th className="p-3.5">کمیسیون</th>
                    <th className="p-3.5">سهم راننده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tariffs.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-semibold text-slate-800">{t.origin_zone_name || `منطقه #${t.origin_zone_id}`}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{t.destination_zone_name || `منطقه #${t.destination_zone_id}`}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{t.base_price.toLocaleString('fa-IR')}</td>
                      <td className="p-3.5 font-mono text-purple-700 font-bold">{t.night_price.toLocaleString('fa-IR')}</td>
                      <td className="p-3.5 font-mono text-slate-500">{(t.base_price * (t.commission_rate || 0.15)).toLocaleString('fa-IR')}</td>
                      <td className="p-3.5 font-mono text-emerald-600 font-bold">
                        {(t.base_price * (1 - (t.commission_rate || 0.15))).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SMART FARE CALCULATOR */}
      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calculator className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-800">شبیه‌ساز و استعلام زنده کرایه سفر</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">مبدأ حرکت:</label>
                <input
                  type="text"
                  value={calcOrigin}
                  onChange={(e) => setCalcOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                  placeholder="مثلاً فرودگاه امام یا فاز ۱"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">مقصد مسافر:</label>
                <input
                  type="text"
                  value={calcDest}
                  onChange={(e) => setCalcDest(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                  placeholder="مثلاً پارک فناوری پردیس"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نوع سرویس:</label>
                  <select
                    value={calcServiceType}
                    onChange={(e) => setCalcServiceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="استاندارد">استاندارد (سواری)</option>
                    <option value="VIP">تشریفات (VIP)</option>
                    <option value="VAN">ون (گروهی)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">کرایه توافقی (اختیاری):</label>
                  <input
                    type="number"
                    value={calcAgreedPrice}
                    onChange={(e) => setCalcAgreedPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="در صورت توافق دستی"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 font-mono text-left"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={calcIsNight}
                    onChange={(e) => setCalcIsNight(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>شیفت شب (۲۲:۰۰ تا ۰۶:۰۰) +۲۰٪</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={calcIsHoliday}
                    onChange={(e) => setCalcIsHoliday(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>تعطیلات و ساعات پیک +۲۵٪</span>
                </label>
              </div>
            </div>
          </div>

          {/* Calculator Result Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] text-teal-400 font-bold bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-800">
                نتیجه استعلام هوشمند
              </span>
              <h3 className="text-xl font-black text-white pt-2">
                {calcResult ? calcResult.price.toLocaleString('fa-IR') : '۰'} تومان
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>قانون اعمال‌شده: {calcResult?.rule_applied}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-4 border-t border-slate-700">
              <div className="p-2.5 bg-slate-800/80 rounded-xl">
                <p className="text-[10px] text-slate-400">سهم راننده (۸۵٪)</p>
                <p className="font-bold text-emerald-400 font-mono mt-0.5">
                  {calcResult ? calcResult.driver_share.toLocaleString('fa-IR') : '۰'}
                </p>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-xl">
                <p className="text-[10px] text-slate-400">کمیسیون آژانس (۱۵٪)</p>
                <p className="font-bold text-amber-400 font-mono mt-0.5">
                  {calcResult ? calcResult.commission.toLocaleString('fa-IR') : '۰'}
                </p>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-xl">
                <p className="text-[10px] text-slate-400">زمان تخمینی</p>
                <p className="font-bold text-teal-300 font-mono mt-0.5">
                  {calcResult ? calcResult.estimated_time_min : '۱۵'} دقیقه
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New POI Modal */}
      {isPoiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">افزودن مکان شاخص با نرخ ثابت (POI)</h3>
              <button onClick={() => setIsPoiModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreatePoi} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">نام مکان:</label>
                <input
                  type="text"
                  required
                  value={poiName}
                  onChange={(e) => setPoiName(e.target.value)}
                  placeholder="مثلاً فرودگاه پیام یا بیمارستان الغدیر"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">دسته‌بندی:</label>
                <select
                  value={poiCategory}
                  onChange={(e) => setPoiCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="فرودگاه">فرودگاه و ترمینال هوایی</option>
                  <option value="ترمینال">پایانه مسافربری و مترو</option>
                  <option value="مراکز درمانی">بیمارستان و درمانی</option>
                  <option value="مراکز فناوری">فناوری و دانشگاهی</option>
                  <option value="مراکز تجاری">مجتمع‌های تجاری</option>
                  <option value="مسکونی">شهرک‌ها و فازهای پردیس</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">آدرس / محدوده:</label>
                <input
                  type="text"
                  value={poiAddress}
                  onChange={(e) => setPoiAddress(e.target.value)}
                  placeholder="آدرس دقیق یا بلوار دسترسی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">عرض جغرافیایی (Lat):</label>
                  <input
                    type="text"
                    value={poiLat}
                    onChange={(e) => setPoiLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">طول جغرافیایی (Lng):</label>
                  <input
                    type="text"
                    value={poiLng}
                    onChange={(e) => setPoiLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">نرخ ثابت مصوب (تومان):</label>
                <input
                  type="number"
                  required
                  step="5000"
                  value={poiPrice}
                  onChange={(e) => setPoiPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-left font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold"
                >
                  ثبت مکان شاخص
                </button>
                <button
                  type="button"
                  onClick={() => setIsPoiModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
