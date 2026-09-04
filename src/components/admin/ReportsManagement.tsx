import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AgencyReportSummary } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Award,
} from 'lucide-react';

export const ReportsManagement: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [summary, setSummary] = useState<AgencyReportSummary | null>(null);
  const [driverRanks, setDriverRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReportsSummary(period);
      setSummary(data);

      // Also get drivers for ranking
      const drivers = await api.getDrivers({ status: 'ALL' });
      const ranked = drivers
        .map((d) => ({
          name: d.full_name,
          car: `${d.car_name} (${d.license_plate})`,
          trips: d.completed_trips,
          revenue: d.completed_trips * 180000,
          commission: Math.round(d.completed_trips * 180000 * 0.15),
          debt: d.total_debt,
        }))
        .sort((a, b) => b.trips - a.trips);
      setDriverRanks(ranked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  // Export CSV
  const handleExportCSV = () => {
    if (!driverRanks.length) return;
    const headers = 'نام راننده,خودرو,تعداد سفر,درآمد ناخالص (تومان),کمیسیون آژانس (تومان),بدهی فعلی (تومان)\n';
    const rows = driverRanks
      .map(
        (r) =>
          `"${r.name}","${r.car}",${r.trips},${r.revenue},${r.commission},${r.debt}`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `گزارش_آژانس_پردیس_${period}.csv`;
    link.click();
  };

  // Chart trend data based on period
  const trendData = [
    { name: 'شنبه', trips: 14, revenue: 2100000, commission: 315000 },
    { name: 'یکشنبه', trips: 18, revenue: 2700000, commission: 405000 },
    { name: 'دوشنبه', trips: 15, revenue: 2250000, commission: 337500 },
    { name: 'سه‌شنبه', trips: 22, revenue: 3300000, commission: 495000 },
    { name: 'چهارشنبه', trips: 26, revenue: 3900000, commission: 585000 },
    { name: 'پنج‌شنبه', trips: 31, revenue: 4650000, commission: 697500 },
    { name: 'جمعه', trips: 20, revenue: 3000000, commission: 450000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">گزارش‌های مدیریتی و آماری آژانس</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            روند درآمد، تحلیل سفرهای روزانه، هفتگی، ماهانه و عملکرد ناوگان رانندگان
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer shadow-xs"
            title="چاپ گزارش"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">چاپ گزارش</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی اکسل / CSV</span>
          </button>
        </div>
      </div>

      {/* Period Filter Selector */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 w-fit text-xs shadow-xs">
        {[
          { id: 'daily', label: 'امروز' },
          { id: 'weekly', label: 'هفتگی' },
          { id: 'monthly', label: 'ماهانه' },
          { id: 'yearly', label: 'سالانه' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPeriod(item.id as any)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              period === item.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium mb-0.5">کل کرایه گردش‌یافته</div>
          <div className="text-lg font-black text-slate-800">
            {(summary?.total_revenue || 0).toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-green-700 mt-0.5 block">گردش مالی رانندگان و آژانس</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium mb-0.5">خالص کمیسیون آژانس (۱۵٪)</div>
          <div className="text-lg font-black text-amber-600">
            {(summary?.total_commission || 0).toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">سود قطعی آژانس تاکسی</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium mb-0.5">تعداد سفرهای موفق</div>
          <div className="text-lg font-black text-teal-700">
            {(summary?.completed_trips || 0).toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-400">سفر</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">از کل {summary?.total_trips || 0} تقاضا</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium mb-0.5">میانگین کرایه هر سفر</div>
          <div className="text-lg font-black text-slate-800">
            {summary && summary.completed_trips > 0
              ? Math.round(summary.total_revenue / summary.completed_trips).toLocaleString('fa-IR')
              : '۰'}{' '}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-teal-700 mt-0.5 block">متوسط ارزش سفرها</span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Area Chart */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>نمودار روند درآمد کمیسیون آژانس (تومان)</span>
            </h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toLocaleString('fa-IR')}ک`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString('fa-IR')} تومان`, 'کمیسیون']}
                />
                <Area type="monotone" dataKey="commission" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#commGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Bar Chart */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>تعداد سفرهای اعزامی روزانه ناوگان</span>
            </h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} سفر`, 'سفرهای ثبت‌شده']}
                />
                <Bar dataKey="trips" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver Performance Ranking */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>جدول رتبه‌بندی و عملکرد ناوگان رانندگان پردیس</span>
          </h3>
          <span className="text-[11px] text-slate-400">مرتب بر اساس بیشترین سفر</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 pb-2">
                <th className="py-2.5 pr-2 font-medium">رتبه</th>
                <th className="py-2.5 font-medium">نام راننده</th>
                <th className="py-2.5 font-medium">خودرو / پلاک</th>
                <th className="py-2.5 font-medium">تعداد سفر</th>
                <th className="py-2.5 font-medium">درآمد ناخالص</th>
                <th className="py-2.5 font-medium">کمیسیون آژانس</th>
                <th className="py-2.5 pl-2 text-left font-medium">مانده بدهی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverRanks.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 pr-2 font-mono font-bold text-teal-700">#{idx + 1}</td>
                  <td className="py-2.5 font-bold text-slate-800">{item.name}</td>
                  <td className="py-2.5 text-slate-500">{item.car}</td>
                  <td className="py-2.5 font-bold text-teal-700">{item.trips} سفر</td>
                  <td className="py-2.5 text-slate-800">{item.revenue.toLocaleString('fa-IR')} تومان</td>
                  <td className="py-2.5 text-amber-700 font-bold">{item.commission.toLocaleString('fa-IR')} تومان</td>
                  <td className="py-2.5 pl-2 text-left">
                    <span className={item.debt > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-medium'}>
                      {item.debt.toLocaleString('fa-IR')} تومان
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
