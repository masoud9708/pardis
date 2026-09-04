import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SmsLog } from '../../types';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Coins,
} from 'lucide-react';

export const SmsManagement: React.FC = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Send Form State
  const [receptor, setReceptor] = useState<string>('0912');
  const [template, setTemplate] = useState<string>('welcome_driver');
  const [token, setToken] = useState<string>('علی رضایی');
  const [customMessage, setCustomMessage] = useState<string>(
    'علی رضایی عزیز، مدارک هویتی و خودرو شما تایید و حساب راننده در آژانس تاکسی پردیس فعال گردید.'
  );

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getSmsLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching SMS logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleTemplateChange = (t: string) => {
    setTemplate(t);
    switch (t) {
      case 'welcome_driver':
        setToken('علی رضایی');
        setCustomMessage(
          'علی رضایی گرامی، مدارک هویتی و خودروی شما در سامانه تاکسی پردیس تایید گردید. هم‌اکنون می‌توانید اپلیکیشن را باز کرده و آنلاین شوید.'
        );
        break;
      case 'new_trip':
        setToken('TRP-1005');
        setCustomMessage(
          'سفر جدید شماره TRP-1005 از مبدا «میدان عدالت» به مقصد «فاز ۱۱ کوزو» به شما واگذار شد. لطفاً در اپلیکیشن بررسی فرمایید.'
        );
        break;
      case 'low_balance':
        setToken('۴۵,۰۰۰');
        setCustomMessage(
          'راننده گرامی، موجودی کیف پول شما به کمتر از حداقل مجاز (۵۰,۰۰۰ تومان) رسیده است. جهت ادامه فعالیت، نسبت به شارژ آنلاین اقدام فرمایید.'
        );
        break;
      case 'doc_expiry':
        setToken('بیمه‌نامه شخص ثالث');
        setCustomMessage(
          'هشدار: بیمه‌نامه خودروی شما ظرف ۷ روز آینده منقضی می‌شود. لطفاً تصویر بیمه‌نامه جدید را در سامانه پردیس بارگذاری فرمایید.'
        );
        break;
      case 'otp':
        setToken('۵۴۸۲۱');
        setCustomMessage('کد تایید ورود به سامانه تاکسی پردیس: ۵۴۸۲۱ | مدت اعتبار: ۳ دقیقه');
        break;
      default:
        break;
    }
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receptor || !customMessage) return;

    try {
      setSending(true);
      await api.sendSms({
        receptor,
        template_name: template,
        token,
        message: customMessage,
      });

      setSendSuccess(`پیامک کاوه‌نگار با موفقیت به شماره ${receptor} مخابره و در وب‌سرویس ثبت گردید.`);
      await fetchLogs();
      setTimeout(() => setSendSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پیامک');
    } finally {
      setSending(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.receptor.includes(searchTerm) ||
      l.message.includes(searchTerm) ||
      l.template_name.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">سامانه اطلاع‌رسانی پیامک کاوه‌نگار (Kavenegar API)</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              مخابره خودکار کدهای تایید OTP، خوش‌آمدگویی و فعال‌سازی رانندگان، اعلان سفر و هشدارهای کمبود موجودی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>اعتبار کاوه‌نگار:</span>
            <span className="font-bold text-teal-300 font-mono">۴,۸۵۰,۰۰۰ ریال</span>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition"
            title="همگام‌سازی لاگ‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column: Recent SMS Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800">تاریخچه پیامک‌های ارسالی سیستم</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full font-bold">
                  {logs.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در گیرنده یا متن پیام..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Logs List */}
            <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  هیچ لاگ پیامکی با این مشخصات یافت نشد.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {log.receptor}
                        </span>
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {log.template_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          تحویل به مخابرات
                        </span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 font-sans">
                      {log.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>هزینه ارسال: {log.cost || 120} ریال</span>
                      <span className="font-mono text-slate-300">شناسه لاگ: SMS-{log.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Send Test SMS Sandbox */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Send className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">ارسال پیامک تستی / آزمایشی کاوه‌نگار</h3>
            </div>

            {sendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sendSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendSms} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">الگوی پیامک (Template):</label>
                <select
                  value={template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="welcome_driver">خوش‌آمدگویی و فعال‌سازی راننده (Welcome)</option>
                  <option value="new_trip">تخصیص سفر جدید به راننده (New Trip)</option>
                  <option value="low_balance">هشدار کمبود موجودی کیف پول (Low Balance)</option>
                  <option value="doc_expiry">هشدار انقضای بیمه‌نامه / معاینه فنی</option>
                  <option value="otp">ارسال رمز یکبار مصرف ورود (OTP Code)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">شماره گیرنده (راننده یا مدیر):</label>
                <input
                  type="tel"
                  required
                  value={receptor}
                  onChange={(e) => setReceptor(e.target.value)}
                  placeholder="09121112233"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">متن کامل پیامک ارسالی:</label>
                <textarea
                  rows={4}
                  required
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'در حال ارسال به سرور کاوه‌نگار...' : 'ارسال آنی پیامک (تست درگاه)'}</span>
              </button>
            </form>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              قوانین وب‌سرویس کاوه‌نگار:
            </h4>
            <p className="leading-relaxed">
              پیامک‌های خط خدماتی آژانس تاکسی پردیس حتی برای رانندگانی که دریافت پیامک تبلیغاتی را مسدود کرده‌اند (بلک‌لیست) با اولویت آنی ارسال و ظرف حداکثر ۵ ثانیه تحویل داده می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
