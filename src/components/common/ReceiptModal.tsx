import React from 'react';
import { CheckCircle2, Printer, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    agency_name?: string;
    reference_number?: string;
    transaction_id?: string;
    amount?: number;
    date?: string;
    time?: string;
    card_mask?: string;
    gateway?: string;
    status?: string;
    remaining_debt?: number;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-slate-800">
        {/* Header Ribbon */}
        <div className="bg-green-50 border-b border-green-100 p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 mb-1.5 ring-4 ring-green-50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">رسید الکترونیکی پرداخت</h3>
          <p className="text-[11px] text-green-700 mt-0.5">تراکنش با موفقیت در شاپرک تأیید و تسویه شد</p>
        </div>

        {/* Receipt Content */}
        <div className="p-5 space-y-3.5">
          <div className="text-center py-2 border-b border-dashed border-slate-200">
            <span className="text-[11px] text-slate-400">مبلغ پرداخت شده:</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {(receipt.amount || 0).toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">نام پذیرنده:</span>
              <span className="font-semibold text-slate-800">{receipt.agency_name || 'آژانس تاکسی پردیس'}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">شماره مرجع (Reference):</span>
              <span className="font-mono font-bold text-teal-700">{receipt.reference_number}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">شماره پیگیری درگاه:</span>
              <span className="font-mono text-slate-700">{receipt.transaction_id}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">تاریخ و زمان پرداخت:</span>
              <span className="text-slate-700">
                {receipt.date} - ساعت {receipt.time}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">کارت مبدأ:</span>
              <span className="font-mono text-slate-700">{receipt.card_mask}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">درگاه پرداخت:</span>
              <span className="text-slate-700">{receipt.gateway}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">مانده بدهی کمیسیون:</span>
              <span className="font-bold text-slate-800">
                {(receipt.remaining_debt || 0).toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-slate-600 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>این رسید دارای امضای دیجیتال معتبر در سامانه مالی تاکسی پردیس می‌باشد.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            چاپ رسید
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
