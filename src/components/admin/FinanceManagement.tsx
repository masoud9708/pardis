import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Driver, PaymentTransaction, DriverLedgerEntry } from '../../types';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  CreditCard,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const FinanceManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<DriverLedgerEntry[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [driversData, paymentsData] = await Promise.all([
        api.getDrivers({ status: 'ALL' }),
        api.getPayments(),
      ]);
      setDrivers(driversData);
      setPayments(paymentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleViewLedger = async (driverId: number) => {
    setSelectedDriverId(driverId);
    try {
      const data = await api.getDriverLedger(driverId);
      setLedgerEntries(data.entries);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReceipt = (payment: PaymentTransaction) => {
    if (payment.receipt_data) {
      try {
        setSelectedReceipt(JSON.parse(payment.receipt_data));
        setIsReceiptOpen(true);
      } catch {
        // Fallback
        setSelectedReceipt({
          agency_name: 'آژانس تاکسی پردیس',
          reference_number: payment.reference_number,
          transaction_id: payment.transaction_id,
          amount: payment.amount,
          date: payment.created_at?.slice(0, 10),
          time: payment.created_at?.slice(11, 16),
          card_mask: payment.card_pan_mask || '۶۱۰۴-۳۳**-****-۸۱۴۲',
          gateway: payment.gateway_name,
        });
        setIsReceiptOpen(true);
      }
    }
  };

  const totalOutstandingDebt = drivers.reduce((acc, d) => acc + (d.total_debt || 0), 0);
  const totalCollectedPayments = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-800">مدیریت مالی و حسابداری کمیسیون</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          گردش حساب رانندگان، صورت‌حساب بدهی کمیسیون و گزارش پرداخت‌های اینترنتی
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>مجموع مطالبات (بدهی رانندگان)</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-black text-red-600">
            {totalOutstandingDebt.toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">مانده بدهی کمیسیون سفرهای انجام شده</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>مجموع پرداخت‌های آنلاین وصول شده</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-xl font-black text-green-600">
            {totalCollectedPayments.toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">واریزی‌های موفق از طریق درگاه بانکی</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>درگاه متصل و فعال</span>
            <CreditCard className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-800">سامان کیش (SEP)</div>
          <p className="text-[11px] text-teal-700 mt-0.5">شناسه پذیرنده فعال و متصل به شاپرک</p>
        </div>
      </div>

      {/* Driver Balances Table */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-xs">مانده حساب و بدهی کمیسیون رانندگان</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 pb-2">
                <th className="py-2.5 pr-2 font-medium">راننده</th>
                <th className="py-2.5 font-medium">شماره تماس</th>
                <th className="py-2.5 font-medium">خودرو / پلاک</th>
                <th className="py-2.5 font-medium">سفرهای موفق</th>
                <th className="py-2.5 font-medium">مانده بدهی کمیسیون</th>
                <th className="py-2.5 pl-2 text-left font-medium">دفتر حساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((drv) => (
                <tr key={drv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 pr-2 font-bold text-slate-800">{drv.full_name}</td>
                  <td className="py-3 font-mono text-slate-500">{drv.mobile}</td>
                  <td className="py-3 text-slate-600">
                    {drv.car_name} ({drv.license_plate})
                  </td>
                  <td className="py-3 text-slate-800 font-bold">{drv.completed_trips} سفر</td>
                  <td className="py-3">
                    <span
                      className={`font-black ${
                        drv.total_debt > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {(drv.total_debt || 0).toLocaleString('fa-IR')} تومان
                    </span>
                  </td>
                  <td className="py-3 pl-2 text-left">
                    <button
                      onClick={() => handleViewLedger(drv.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-700 text-xs font-semibold transition cursor-pointer"
                    >
                      گردش حساب
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Driver Ledger History */}
      {selectedDriverId && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>گردش ریز تراکنش‌های دفتر کل راننده #{selectedDriverId}</span>
            </h3>
            <button
              onClick={() => setSelectedDriverId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              بستن
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {ledgerEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.type === 'COMMISSION_DEBT'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {entry.type === 'COMMISSION_DEBT' ? 'ثبت کمیسیون سفر' : 'پرداخت آنلاین'}
                    </span>
                    <span className="text-slate-800 font-medium">{entry.description}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    شناسه پیگیری: {entry.reference_number || '-'} | تاریخ: {entry.created_at}
                  </div>
                </div>

                <div className="text-left">
                  <div
                    className={`font-black text-xs ${
                      entry.type === 'COMMISSION_DEBT' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {entry.type === 'COMMISSION_DEBT' ? '+' : '-'}
                    {entry.amount.toLocaleString('fa-IR')} تومان
                  </div>
                  <div className="text-[10px] text-slate-400">
                    مانده پس از تراکنش: {entry.balance_after.toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Payments History */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-xs">تراکنش‌های پرداخت آنلاین درگاه بانکی</h3>

        <div className="space-y-2 text-xs">
          {payments.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{p.driver_name}</span>
                  <span className="font-mono text-teal-700">({p.reference_number})</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'SUCCESS'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}
                  >
                    {p.status === 'SUCCESS' ? 'موفق و تسویه شده' : p.status}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  درگاه: {p.gateway_name} | کارت: {p.card_pan_mask || '-'} | تاریخ: {p.created_at}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <div className="font-bold text-slate-800 text-xs">
                  {p.amount.toLocaleString('fa-IR')} تومان
                </div>
                <button
                  onClick={() => handleOpenReceipt(p)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-teal-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>رسید دیجیتال</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};
