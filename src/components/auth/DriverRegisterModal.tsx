import React, { useState } from 'react';
import { api } from '../../services/api';
import { IRANIAN_CAR_CATEGORIES, findCarDefaults } from '../../data/iranianCars';
import {
  X,
  User,
  Car,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react';

interface DriverRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (driverId: number) => void;
}

export const DriverRegisterModal: React.FC<DriverRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Car list filters & custom entry
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('ALL');
  const [carSearchQuery, setCarSearchQuery] = useState<string>('');
  const [isCustomCar, setIsCustomCar] = useState<boolean>(false);
  const [customCarName, setCustomCarName] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    first_name: '',
    last_name: '',
    mobile: '',
    national_code: '',
    birth_date: '',
    address: '',
    emergency_contact: '',
    password: '',
    // Step 2: Vehicle
    car_name: 'پژو پارس',
    model: 'TU5',
    color: 'سفید',
    plate_part1: '۱۲',
    plate_letter: 'ج',
    plate_part2: '۳۴۵',
    plate_city: '۲۲',
    year: '۱۴۰۲',
    vehicle_type: 'STANDARD',
    // Step 3: Documents
    license_preview: 'گواهینامه رانندگی پایه دوم (ضمیمه شد)',
    car_card_preview: 'کارت خودرو معتبر (ضمیمه شد)',
    insurance_preview: 'بیمه‌نامه شخص ثالث (ضمیمه شد)',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCarSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'سایر خودروها (ثبت دستی)') {
      setIsCustomCar(true);
      setFormData((prev) => ({ ...prev, car_name: selected }));
      return;
    }

    setIsCustomCar(false);
    const defaults = findCarDefaults(selected);
    setFormData((prev) => ({
      ...prev,
      car_name: selected,
      model: defaults?.defaultModel || prev.model,
      vehicle_type: defaults?.defaultType || prev.vehicle_type,
    }));
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.mobile || !formData.national_code) {
        setError('لطفاً نام، نام خانوادگی، شماره موبایل و کد ملی را تکمیل فرمایید.');
        return;
      }
      if (formData.national_code.length !== 10) {
        setError('کد ملی باید دقیقاً ۱۰ رقمی باشد.');
        return;
      }
    }
    if (step === 2) {
      const activeCar = isCustomCar ? customCarName.trim() : formData.car_name;
      if (!activeCar) {
        setError('لطفاً نام خودرو را انتخاب یا وارد فرمایید.');
        return;
      }
      if (!formData.plate_part1 || !formData.plate_part2) {
        setError('لطفاً مشخصات کامل خودرو و پلاک را وارد فرمایید.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const activeCar = isCustomCar ? customCarName.trim() : formData.car_name;
    const fullLicensePlate = `${formData.plate_part1} ${formData.plate_letter} ${formData.plate_part2} ایران ${formData.plate_city}`;

    try {
      const res = await api.registerDriver({
        ...formData,
        car_name: activeCar,
        license_plate: fullLicensePlate,
      });
      onSuccess(res.driver_id);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on manufacturer tab & search query
  const filteredCategories = IRANIAN_CAR_CATEGORIES.map((cat) => {
    const matchesManufacturer =
      manufacturerFilter === 'ALL' || cat.manufacturer.includes(manufacturerFilter);
    if (!matchesManufacturer) {
      return { ...cat, cars: [] };
    }
    const filteredCars = cat.cars.filter((car) => {
      if (!carSearchQuery.trim()) return true;
      const q = carSearchQuery.trim().toLowerCase();
      return (
        car.name.toLowerCase().includes(q) ||
        (car.defaultModel && car.defaultModel.toLowerCase().includes(q))
      );
    });
    return { ...cat, cars: filteredCars };
  }).filter((cat) => cat.cars.length > 0);

  const totalFilteredCount = filteredCategories.reduce(
    (acc, cat) => acc + cat.cars.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">ثبت‌نام راننده و ناوگان جدید</h3>
              <p className="text-xs text-slate-400">سامانه تاکسی سرویس پردیس</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-teal-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              ۱
            </span>
            <span>اطلاعات فردی</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-800" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-teal-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              ۲
            </span>
            <span>مشخصات خودرو</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-800" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-teal-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              ۳
            </span>
            <span>مدارک</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-800" />
          <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-teal-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              ۴
            </span>
            <span>تأیید نهایی</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">نام *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="مثال: حسین"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">نام خانوادگی *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="مثال: موسوی"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">شماره موبایل *</label>
                  <input
                    type="tel"
                    name="mobile"
                    dir="ltr"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="0912xxxxxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-left focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">کد ملی (۱۰ رقم) *</label>
                  <input
                    type="text"
                    name="national_code"
                    dir="ltr"
                    maxLength={10}
                    value={formData.national_code}
                    onChange={handleChange}
                    placeholder="0012345678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-left focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">تاریخ تولد</label>
                  <input
                    type="text"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    placeholder="1370/05/20"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">شماره تماس اضطراری</label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    dir="ltr"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="0912xxxxxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-left focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">آدرس محل سکونت</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="شهر پردیس، فاز ۳..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">رمز عبور ورود به سامانه</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="حداقل ۶ کاراکتر (پیش‌فرض: driver123)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: VEHICLE */}
          {step === 2 && (
            <div className="space-y-3.5">
              {/* Manufacturer Filter Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-teal-400" />
                      <span>انتخاب خودرو از میان انواع خودروهای ایرانی ({totalFilteredCount} مدل)</span>
                    </label>
                    <span className="text-[10px] text-teal-400 font-medium hidden sm:inline">
                      ایران خودرو، سایپا، پارس خودرو، مدیران خودرو و...
                    </span>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                    {[
                      { id: 'ALL', label: 'همه خودروها' },
                      { id: 'ایران خودرو', label: 'ایران خودرو' },
                      { id: 'سایپا', label: 'سایپا و پارس خودرو' },
                      { id: 'مدیران', label: 'مدیران خودرو' },
                      { id: 'کرمان', label: 'کرمان موتور' },
                      { id: 'بهمن', label: 'گروه بهمن' },
                      { id: 'سایر', label: 'سایر / ون / تشریفات' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setManufacturerFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                          manufacturerFilter === tab.id
                            ? 'bg-teal-600 text-white font-bold shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search and Car Select */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={carSearchQuery}
                      onChange={(e) => setCarSearchQuery(e.target.value)}
                      placeholder="جستجوی سریع مدل (مثلاً: دنا، تارا، کوییک، شاهین، سورن، ۲۰۷، ساینا، تیبا، جک...)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-16 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    {carSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCarSearchQuery('')}
                        className="absolute left-2.5 top-1.5 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                      >
                        پاک کردن
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium text-xs">
                      نام و مدل خودرو *
                    </label>
                    <select
                      name="car_name"
                      value={formData.car_name}
                      onChange={handleCarSelect}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500 text-xs font-medium"
                    >
                      {filteredCategories.map((cat) => (
                        <optgroup key={cat.manufacturer} label={`🚗 ${cat.manufacturer}`}>
                          {cat.cars.map((car) => (
                            <option key={car.name} value={car.name}>
                              {car.name} {car.defaultModel ? `— (${car.defaultModel})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <optgroup label="سایر مدل‌ها">
                        <option value="سایر خودروها (ثبت دستی)">✏️ سایر خودروها (تایپ نام خودرو)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Custom Car Input if other chosen */}
                  {isCustomCar && (
                    <div className="p-3 bg-teal-950/40 border border-teal-700/60 rounded-xl space-y-1 animate-in fade-in">
                      <label className="block text-teal-300 text-xs font-bold">
                        نام و مدل دقیق خودروی خود را بنویسید: *
                      </label>
                      <input
                        type="text"
                        value={customCarName}
                        onChange={(e) => setCustomCarName(e.target.value)}
                        placeholder="مثال: برلیانس H330 اتوماتیک یا چری تیگو ۷..."
                        className="w-full bg-slate-900 border border-teal-600/70 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium text-xs">
                      مدل / تیپ موتور
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="TU5 یا پلاس"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium text-xs">
                      کلاس سرویس (پیشنهادی خودکار)
                    </label>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                    >
                      <option value="STANDARD">استاندارد (اقتصادی و عمومی)</option>
                      <option value="COMFORT">کامفورت (راحت / خانوادگی)</option>
                      <option value="VIP">تشریفات VIP (لوکس و تشریفاتی)</option>
                      <option value="VAN">ون (ظرفیت بالا)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium text-xs">رنگ خودرو</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="سفید"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium text-xs">سال ساخت (شمسی)</label>
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="۱۴۰۲"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                    />
                  </div>
                </div>

                {/* License Plate Graphic Input */}
              <div className="pt-2">
                <label className="block text-slate-300 mb-1.5 font-medium">شماره پلاک ملی خودرو *</label>
                <div className="flex items-center justify-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center bg-white text-slate-950 font-bold border-2 border-slate-900 rounded-lg overflow-hidden shadow-inner dir-ltr">
                    {/* Iran flag section */}
                    <div className="bg-blue-800 text-white px-2 py-1.5 flex flex-col items-center justify-center text-[9px] w-8">
                      <span>I.R.</span>
                      <span>IRAN</span>
                    </div>

                    {/* Part 1: 2 digits */}
                    <input
                      type="text"
                      name="plate_part1"
                      maxLength={2}
                      value={formData.plate_part1}
                      onChange={handleChange}
                      placeholder="۱۲"
                      className="w-10 text-center font-bold text-base py-1 border-none focus:outline-none bg-transparent"
                    />

                    {/* Letter */}
                    <select
                      name="plate_letter"
                      value={formData.plate_letter}
                      onChange={handleChange}
                      className="text-center font-bold text-base py-1 border-none focus:outline-none bg-transparent px-1"
                    >
                      <option value="ب">ب</option>
                      <option value="ج">ج</option>
                      <option value="د">د</option>
                      <option value="س">س</option>
                      <option value="ص">ص</option>
                      <option value="ط">ط</option>
                      <option value="ق">ق</option>
                      <option value="ل">ل</option>
                      <option value="م">م</option>
                      <option value="ن">ن</option>
                      <option value="و">و</option>
                      <option value="ه">ه</option>
                      <option value="ی">ی</option>
                      <option value="ت">ت (تاکسی)</option>
                    </select>

                    {/* Part 2: 3 digits */}
                    <input
                      type="text"
                      name="plate_part2"
                      maxLength={3}
                      value={formData.plate_part2}
                      onChange={handleChange}
                      placeholder="۳۴۵"
                      className="w-12 text-center font-bold text-base py-1 border-none focus:outline-none bg-transparent"
                    />

                    {/* City code: Iran 22 */}
                    <div className="border-r-2 border-slate-900 bg-slate-100 px-2 py-1 flex flex-col items-center text-[10px]">
                      <span className="text-[8px] text-slate-500">ایران</span>
                      <input
                        type="text"
                        name="plate_city"
                        maxLength={2}
                        value={formData.plate_city}
                        onChange={handleChange}
                        className="w-6 text-center font-bold text-xs bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-slate-400">
                تصویر مدارک زیر جهت احراز هویت و بررسی توسط واحد نظارت آژانس تاکسی پردیس الزامی است:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-dashed border-teal-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">تصویر گواهینامه معتبر</div>
                      <div className="text-[11px] text-teal-400">پیوست شده و آماده اعتبارسنجی</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px]">
                    بارگذاری شد
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-dashed border-teal-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">کارت خودرو یا برگ سبز</div>
                      <div className="text-[11px] text-teal-400">پیوست شده و آماده اعتبارسنجی</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px]">
                    بارگذاری شد
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-dashed border-teal-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">بیمه‌نامه شخص ثالث معتبر</div>
                      <div className="text-[11px] text-teal-400">پیوست شده و آماده اعتبارسنجی</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px]">
                    بارگذاری شد
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700 text-slate-400 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>کلیه مدارک به صورت امن در سرور اختصاصی آژانس ذخیره و محافظت می‌شوند.</span>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
                <h4 className="font-bold text-white text-sm border-b border-slate-700 pb-2">
                  خلاصه اطلاعات ثبت‌نام راننده
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">نام کامل:</span>{' '}
                    <span className="text-white font-semibold">
                      {formData.first_name} {formData.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">موبایل:</span>{' '}
                    <span className="font-mono text-teal-300">{formData.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">کد ملی:</span>{' '}
                    <span className="font-mono text-white">{formData.national_code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">خودرو:</span>{' '}
                    <span className="text-white font-semibold">
                      {isCustomCar ? customCarName : formData.car_name} ({formData.color || 'نامشخص'})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">پلاک ملی:</span>{' '}
                    <span className="font-bold text-amber-400">
                      {formData.plate_part1} {formData.plate_letter} {formData.plate_part2} ایران {formData.plate_city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  پس از ثبت، وضعیت شما «در انتظار بررسی» خواهد بود. به محض تأیید توسط مدیر آژانس، پیامک فعال‌سازی
                  ارسال و می‌توانید سفرها را پذیرش نمایید.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <ArrowRight className="w-4 h-4" />
              مرحله قبل
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg shadow-teal-700/30"
            >
              گام بعدی
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-teal-700/30 disabled:opacity-50"
            >
              {loading ? (
                <span>در حال ثبت...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید و ارسال مدارک</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
