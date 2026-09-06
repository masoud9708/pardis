import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Save, CheckCircle2, CreditCard, Building2, Clock } from 'lucide-react';

export const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    agency_name: 'تاکسی سرویس بهرامی خرم‌آباد',
    agency_phone: '۰۶۶-۳۳۴۴۰۰۰۰',
    agency_address: 'استان لرستان، شهرستان خرم‌آباد، روستای بهرامی، خیابان اصلی (جنب فرودگاه)',
    default_commission: '0.15',
    night_shift_start: '22:00',
    night_shift_end: '06:00',
    payment_gateway_name: 'سامان کیش (SEP)',
    payment_merchant_id: '109827346',
  });
  const [saved, setSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-slate-800">تنظیمات کلی آژانس و درگاه</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          پیکربندی هویت آژانس، نرخ کمیسیون پیش‌فرض، ساعات کشیک شب و پذیرنده پرداخت
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span>تنظیمات با موفقیت در پایگاه داده ذخیره گردید.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Agency Identity */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>مشخصات آژانس</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-medium">نام آژانس تاکسی‌سرویس</label>
              <input
                type="text"
                value={settings.agency_name}
                onChange={(e) => setSettings({ ...settings, agency_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-medium">تلفن تماس ثابت / پشتیبانی</label>
              <input
                type="text"
                value={settings.agency_phone}
                onChange={(e) => setSettings({ ...settings, agency_phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-left"
                dir="ltr"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 mb-1 font-medium">آدرس دفتر مرکزی آژانس</label>
              <input
                type="text"
                value={settings.agency_address}
                onChange={(e) => setSettings({ ...settings, agency_address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Operating & Tariff Settings */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>تنظیمات کاری، کمیسیون و شیفت شب</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-medium">درصد کمیسیون آژانس</label>
              <input
                type="text"
                value={settings.default_commission}
                onChange={(e) => setSettings({ ...settings, default_commission: e.target.value })}
                placeholder="0.15 (معادل ۱۵٪)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-medium">ساعت شروع شیفت شب</label>
              <input
                type="text"
                value={settings.night_shift_start}
                onChange={(e) => setSettings({ ...settings, night_shift_start: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-medium">ساعت پایان شیفت شب</label>
              <input
                type="text"
                value={settings.night_shift_end}
                onChange={(e) => setSettings({ ...settings, night_shift_end: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-green-600" />
            <span>پیکربندی درگاه اینترنتی پرداخت بانکی</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-medium">نام شرکت ارائه دهنده درگاه (PSP)</label>
              <input
                type="text"
                value={settings.payment_gateway_name}
                onChange={(e) => setSettings({ ...settings, payment_gateway_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-medium">کد ترمینال / پذیرنده (Merchant ID)</label>
              <input
                type="text"
                value={settings.payment_merchant_id}
                onChange={(e) => setSettings({ ...settings, payment_merchant_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{loading ? 'در حال ذخیره‌سازی...' : 'ذخیره تمام تنظیمات'}</span>
        </button>
      </form>
    </div>
  );
};
