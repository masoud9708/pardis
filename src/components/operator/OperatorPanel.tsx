import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trip, Driver, Zone, PointOfInterest, Customer } from '../../types';
import {
  PhoneCall,
  Plus,
  Car,
  MapPin,
  CheckCircle2,
  Clock,
  User,
  Search,
  Calculator,
  Moon,
  X,
  AlertCircle,
  Users,
  Navigation,
  Award,
  Sparkles,
  Tag,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const OperatorPanel: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Frequent Customers Directory Modal
  const [isCustomerDirOpen, setIsCustomerDirOpen] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    subscription_code: '',
    name: '',
    phone: '',
    address: 'روستای بهرامی، ',
    default_destination: 'خرم‌آباد، ',
    discount_percent: 10,
    notes: '',
  });
  const [addCustomerError, setAddCustomerError] = useState<string>('');
  const [addCustomerSuccess, setAddCustomerSuccess] = useState<string>('');

  // New Trip Modal / Form
  const [isNewTripOpen, setIsNewTripOpen] = useState<boolean>(false);
  const [subCodeInput, setSubCodeInput] = useState<string>('');
  const [subCodeLoading, setSubCodeLoading] = useState<boolean>(false);
  const [subCodeError, setSubCodeError] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    subscription_code: '',
    customer_id: null as number | null,
    customer_name: '',
    customer_phone: '',
    origin_zone_id: '',
    origin: 'روستای بهرامی (دفتر تاکسی‌سرویس)',
    destination_zone_id: '',
    destination: '',
    driver_id: '',
    is_night_shift: false,
    waiting_minutes: 0,
    notes: '',
  });
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [formError, setFormError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsData, driversData, zonesData, poisData, customersData] = await Promise.all([
        api.getTrips(),
        api.getDrivers({ status: 'ALL' }),
        api.getZones(),
        api.getPois(),
        api.getCustomers().catch(() => [] as Customer[]),
      ]);
      setTrips(tripsData);
      setDrivers(driversData);
      setZones(zonesData);
      setPois(poisData);
      setCustomers(customersData);

      if (zonesData.length >= 1 && !formData.origin_zone_id) {
        setFormData((prev) => ({
          ...prev,
          origin_zone_id: String(zonesData[0].id),
          origin: prev.origin || 'روستای بهرامی (دفتر تاکسی‌سرویس)',
          destination_zone_id: zonesData[1] ? String(zonesData[1].id) : '',
          destination: prev.destination || (poisData.length > 2 ? poisData[2].name : ''),
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate price dynamically
  useEffect(() => {
    if (formData.origin_zone_id && formData.destination_zone_id) {
      api
        .calculateTariff({
          origin_zone_id: Number(formData.origin_zone_id),
          destination_zone_id: Number(formData.destination_zone_id),
          is_night: formData.is_night_shift,
          waiting_minutes: Number(formData.waiting_minutes) || 0,
        })
        .then((res) => setCalculatedPrice(res))
        .catch(console.error);
    }
  }, [formData.origin_zone_id, formData.destination_zone_id, formData.is_night_shift, formData.waiting_minutes]);

  // Handle auto-filling customer info using subscription code
  const handleLookupSubscription = async (codeToSearch?: string) => {
    const rawCode = (codeToSearch !== undefined ? codeToSearch : subCodeInput).trim();
    if (!rawCode) {
      setSubCodeError('لطفاً کد اشتراک یا شماره تماس را وارد کنید.');
      return;
    }

    setSubCodeLoading(true);
    setSubCodeError('');

    try {
      // First check in loaded customers for instant speed
      let matched = customers.find(
        (c) =>
          c.subscription_code === rawCode ||
          c.phone === rawCode ||
          (c.phone && c.phone.endsWith(rawCode))
      );

      // If not cached, query server
      if (!matched) {
        matched = await api.getCustomerByCode(rawCode);
      }

      if (matched) {
        setSelectedCustomer(matched);
        setSubCodeInput(matched.subscription_code || rawCode);
        setFormData((prev) => ({
          ...prev,
          subscription_code: matched!.subscription_code || rawCode,
          customer_id: matched!.id,
          customer_name: matched!.name,
          customer_phone: matched!.phone,
          origin: matched!.address || prev.origin,
          destination: matched!.default_destination || prev.destination,
          notes: matched!.notes
            ? prev.notes && !prev.notes.includes(matched!.notes)
              ? `${prev.notes} | ${matched!.notes}`
              : matched!.notes
            : prev.notes,
        }));
        setSubCodeError('');
      } else {
        setSubCodeError(`کد اشتراک «${rawCode}» یافت نشد.`);
      }
    } catch (err: any) {
      setSubCodeError(err.message || `مشتری با کد اشتراک «${rawCode}» پیدا نشد.`);
    } finally {
      setSubCodeLoading(false);
    }
  };

  // Clear customer / reset subscription
  const handleClearSubscription = () => {
    setSelectedCustomer(null);
    setSubCodeInput('');
    setSubCodeError('');
    setFormData((prev) => ({
      ...prev,
      subscription_code: '',
      customer_id: null,
      customer_name: '',
      customer_phone: '',
      origin: zones[0] ? zones[0].name : 'روستای بهرامی (دفتر تاکسی‌سرویس)',
      destination: '',
      notes: '',
    }));
  };

  // Quick select customer directly from directory or chip
  const handleSelectCustomerForTrip = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSubCodeInput(customer.subscription_code);
    setSubCodeError('');
    setFormData((prev) => ({
      ...prev,
      subscription_code: customer.subscription_code,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      origin: customer.address || prev.origin,
      destination: customer.default_destination || prev.destination,
      notes: customer.notes || '',
    }));
    setIsCustomerDirOpen(false);
    setIsNewTripOpen(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.customer_name || !formData.customer_phone || !formData.origin || !formData.destination) {
      setFormError('نام مسافر، شماره تماس، مبدأ و مقصد الزامی است.');
      return;
    }

    // Apply subscriber discount if available
    let finalPrice = calculatedPrice ? calculatedPrice.total_price : 95000;
    if (selectedCustomer && selectedCustomer.discount_percent > 0) {
      const discount = Math.round((finalPrice * selectedCustomer.discount_percent) / 100);
      finalPrice = finalPrice - discount;
    }

    try {
      await api.createTrip({
        customer_id: formData.customer_id,
        subscription_code: formData.subscription_code,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        origin_zone_id: formData.origin_zone_id ? Number(formData.origin_zone_id) : undefined,
        origin: formData.origin,
        destination_zone_id: formData.destination_zone_id ? Number(formData.destination_zone_id) : undefined,
        destination: formData.destination,
        driver_id: formData.driver_id ? Number(formData.driver_id) : undefined,
        is_night_shift: formData.is_night_shift,
        waiting_minutes: Number(formData.waiting_minutes) || 0,
        price: finalPrice,
        notes: formData.notes,
      });

      setIsNewTripOpen(false);
      handleClearSubscription();
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت سفر.');
    }
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCustomerError('');
    setAddCustomerSuccess('');

    if (!newCustomerForm.name || !newCustomerForm.phone) {
      setAddCustomerError('نام و شماره تماس مسافر الزامی است.');
      return;
    }

    try {
      const created = await api.createCustomer(newCustomerForm);
      setAddCustomerSuccess(`مشترک «${created.name}» با کد اشتراک ${created.subscription_code} ثبت شد.`);
      setCustomers((prev) => [created, ...prev]);
      setTimeout(() => {
        setIsAddCustomerOpen(false);
        setAddCustomerSuccess('');
        setNewCustomerForm({
          subscription_code: '',
          name: '',
          phone: '',
          address: 'روستای بهرامی، ',
          default_destination: 'خرم‌آباد، ',
          discount_percent: 10,
          notes: '',
        });
      }, 1200);
    } catch (err: any) {
      setAddCustomerError(err.message || 'خطا در ثبت مشتری.');
    }
  };

  const handleQuickAssign = async (tripId: number, drvId: number) => {
    try {
      await api.assignTrip(tripId, drvId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTrip = async (tripId: number) => {
    try {
      await api.updateTripStatus(tripId, 'COMPLETED');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const onlineDrivers = drivers.filter((d) => d.status === 'ONLINE');
  const activeTrips = trips.filter((t) => ['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status));

  // Filter customers in directory modal
  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearchQuery.trim() ||
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.phone.includes(customerSearchQuery) ||
      (c.subscription_code && c.subscription_code.includes(customerSearchQuery)) ||
      (c.address && c.address.toLowerCase().includes(customerSearchQuery.toLowerCase()))
  );

  // Top frequent customers for quick chip selection
  const topSubscribers = customers.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Action Ribbon */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">میز کار اپراتور پذیرش و اعزام</h2>
            <p className="text-xs text-slate-500">
              پذیرش تلفنی مسافر، ورود کد اشتراک مشتریان پر سفر، محاسبه سیستمی نرخ و اعزام
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
          {/* Customers Directory Button */}
          <button
            onClick={() => {
              setIsCustomerDirOpen(true);
              setCustomerSearchQuery('');
            }}
            className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>مشترکین پر سفر ({customers.length})</span>
          </button>

          {/* New Trip Button */}
          <button
            onClick={() => {
              setIsNewTripOpen(true);
              setFormError('');
              setSubCodeError('');
            }}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 whitespace-nowrap justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سفر تلفنی جدید</span>
          </button>
        </div>
      </div>

      {/* Grid: Live Dispatch Queue & Online Drivers Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trips Dispatch Board (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">سفرهای نیازمند اعزام و پیگیری</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {activeTrips.length}
              </span>
            </div>
          </div>

          {activeTrips.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-xs text-center text-slate-400 text-xs">
              در حال حاضر تمامی سفرها اعزام و انجام شده‌اند.
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col gap-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-teal-600 text-sm">{trip.trip_number}</span>
                      <span className="font-bold text-slate-800 text-sm">{trip.customer_name}</span>
                      {trip.subscription_code && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 border border-amber-300">
                          <Award className="w-3 h-3 text-amber-600" />
                          اشتراک: {trip.subscription_code}
                        </span>
                      )}
                      <a
                        href={`tel:${trip.customer_phone}`}
                        className="font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs flex items-center gap-1 hover:underline"
                        dir="ltr"
                      >
                        <PhoneCall className="w-3 h-3" />
                        {trip.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {trip.price.toLocaleString('fa-IR')} تومان
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          trip.status === 'REQUESTED'
                            ? 'bg-orange-50 text-orange-600 border border-orange-200'
                            : trip.status === 'ASSIGNED'
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}
                      >
                        {trip.status === 'REQUESTED' && 'در انتظار راننده'}
                        {trip.status === 'ASSIGNED' && 'تخصیص داده شده'}
                        {trip.status === 'ACCEPTED' && 'راننده در راه مبدأ'}
                        {trip.status === 'IN_PROGRESS' && 'مسافر سوار شد'}
                      </span>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-teal-700 font-bold">مبدأ:</span>
                    <span>{trip.origin}</span>
                    <span className="text-slate-400">←</span>
                    <span className="text-orange-600 font-bold">مقصد:</span>
                    <span>{trip.destination}</span>
                  </div>

                  {/* Driver Assign / Status row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {trip.driver_name ? (
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-teal-600" />
                        <span>
                          راننده: <strong className="text-slate-800">{trip.driver_name}</strong> ({trip.car_name} -{' '}
                          <span className="font-mono font-bold text-slate-700">{trip.license_plate}</span>)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 font-medium text-[11px]">انتخاب سریع راننده:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleQuickAssign(trip.id, Number(e.target.value));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            -- راننده آماده‌باش --
                          </option>
                          {onlineDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.full_name} ({d.car_name})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(trip.status) && (
                        <button
                          onClick={() => handleCompleteTrip(trip.id)}
                          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تکمیل و پایان سفر</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ready Drivers Dock (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-slate-800 text-sm">رانندگان آماده‌باش و آنلاین</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {onlineDrivers.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 divide-y divide-slate-100 space-y-3">
            {onlineDrivers.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">هیچ راننده‌ای آنلاین نیست.</div>
            ) : (
              onlineDrivers.map((driver) => (
                <div key={driver.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{driver.full_name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {driver.car_name} ({driver.color}) -{' '}
                      <span className="font-mono text-slate-700">{driver.license_plate}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${driver.mobile}`}
                    className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NEW TRIP MODAL WITH SUBSCRIPTION AUTO-FILL               */}
      {/* ======================================================== */}
      {isNewTripOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateTrip}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">پذیرش و اعزام سفر تلفنی جدید</h3>
                  <p className="text-[11px] text-slate-500">
                    با وارد کردن کد اشتراک، تمامی اطلاعات مسافر به صورت خودکار ثبت می‌شود
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTripOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 max-h-[75vh]">
              {/* ============================================== */}
              {/* SUBSCRIPTION CODE SECTION (مشتریان پر سفر)     */}
              {/* ============================================== */}
              <div className="p-3.5 rounded-xl bg-gradient-to-l from-amber-50/70 to-teal-50/70 border border-amber-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>کد اشتراک مسافر پر سفر (ورود خودکار مشخصات):</span>
                  </label>
                  {selectedCustomer && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      اشتراک فعال شد
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={subCodeInput}
                      onChange={(e) => {
                        setSubCodeInput(e.target.value);
                        if (e.target.value.trim().length >= 3) {
                          handleLookupSubscription(e.target.value.trim());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupSubscription();
                        }
                      }}
                      placeholder="کد اشتراک مسافر را وارد نمایید (مثال: ۱۰۱، ۱۰۲، ۱۰۳...)"
                      className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-lg pr-3 pl-8 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-200 font-bold placeholder:font-normal"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLookupSubscription()}
                    disabled={subCodeLoading}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1 whitespace-nowrap"
                  >
                    {subCodeLoading ? 'در حال جستجو...' : 'استعلام کد'}
                  </button>

                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={handleClearSubscription}
                      className="px-2.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition"
                      title="لغو انتخاب مشترک"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>

                {/* Sub Code Error */}
                {subCodeError && (
                  <div className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{subCodeError}</span>
                  </div>
                )}

                {/* Quick Frequent Subscribers Chips */}
                {topSubscribers.length > 0 && !selectedCustomer && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">مشترکین پر سفر اخیر:</span>
                    {topSubscribers.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleLookupSubscription(sub.subscription_code)}
                        className="px-2 py-0.5 rounded-full bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 text-[10px] font-medium transition flex items-center gap-1 shadow-2xs"
                      >
                        <span className="font-bold text-amber-800">کد {sub.subscription_code}:</span>
                        <span>{sub.name}</span>
                        <span className="text-slate-400 font-mono">({sub.total_trips} سفر)</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* VIP Customer Info Badge / Card */}
                {selectedCustomer && (
                  <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                          VIP
                        </div>
                        <div>
                          <strong className="text-slate-800 text-xs">{selectedCustomer.name}</strong>
                          <span className="text-[11px] text-slate-500 mr-2 font-mono">
                            کد اشتراک: {selectedCustomer.subscription_code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200">
                          {selectedCustomer.total_trips} سفر انجام شده
                        </span>
                        {selectedCustomer.discount_percent > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            {selectedCustomer.discount_percent}٪ تخفیف طلایی
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <span className="text-slate-400">مبدأ همیشگی: </span>
                        <span className="font-medium text-slate-700">{selectedCustomer.address || 'ثبت نشده'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">مقصد متداول: </span>
                        <span className="font-medium text-slate-700">{selectedCustomer.default_destination || 'ثبت نشده'}</span>
                      </div>
                      {selectedCustomer.notes && (
                        <div className="sm:col-span-2 text-amber-700 bg-amber-50/60 px-2 py-1 rounded border border-amber-100">
                          <span className="font-bold">یادداشت مشترک: </span>
                          <span>{selectedCustomer.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">نام مسافر *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="مثال: حاج علی بیرانوند"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">شماره تماس مسافر *</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="0916xxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-left focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Zones / Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">منطقه مبدأ</label>
                  <select
                    value={formData.origin_zone_id}
                    onChange={(e) => {
                      const z = zones.find((item) => item.id === Number(e.target.value));
                      setFormData({
                        ...formData,
                        origin_zone_id: e.target.value,
                        origin: z ? z.name : formData.origin,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">منطقه مقصد</label>
                  <select
                    value={formData.destination_zone_id}
                    onChange={(e) => {
                      const z = zones.find((item) => item.id === Number(e.target.value));
                      setFormData({
                        ...formData,
                        destination_zone_id: e.target.value,
                        destination: z ? z.name : formData.destination,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Khorramabad Neighborhood Selector */}
              {pois.length > 0 && (
                <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                  <label className="block text-slate-800 mb-1.5 font-bold flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-teal-800">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      انتخاب مستقیم مقصد از محله‌های خرم‌آباد (نرخ مصوب ثابت):
                    </span>
                    <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                      مبدأ: روستای بهرامی
                    </span>
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const poi = pois.find((p) => p.id === selectedId);
                      if (poi) {
                        setFormData((prev) => ({
                          ...prev,
                          destination: poi.name,
                        }));
                      }
                    }}
                    className="w-full bg-white border border-teal-200 rounded-lg px-2.5 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    <option value="">-- کلیک کنید: انتخاب محله خرم‌آباد با نرخ مصوب --</option>
                    {pois.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ◄ {p.fixed_price ? `${p.fixed_price.toLocaleString('fa-IR')} تومان` : 'نرخ توافقی'} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Exact Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">آدرس دقیق مبدأ</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="روستای بهرامی..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">آدرس دقیق مقصد</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="محله، خیابان، پلاک..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Driver and Waiting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">تخصیص به راننده (اختیاری)</label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- بعداً تخصیص داده شود --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.car_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">زمان توقف و انتظار (دقیقه)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.waiting_minutes}
                    onChange={(e) => setFormData({ ...formData, waiting_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_night_shift}
                    onChange={(e) => setFormData({ ...formData, is_night_shift: e.target.checked })}
                    className="rounded accent-teal-600"
                  />
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>اعمال ضریب کرایه شیفت شب (ساعت ۲۲:۰۰ الی ۰۶:۰۰)</span>
                </label>
              </div>

              {/* Calculated Price Banner with Subscriber Discount Breakdown */}
              {calculatedPrice && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[11px]">کرایه پایه تعرفه:</span>
                      <span className="text-sm font-black text-slate-800">
                        {calculatedPrice.total_price.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    {selectedCustomer && selectedCustomer.discount_percent > 0 && (
                      <div className="text-center">
                        <span className="text-emerald-600 block text-[11px] font-bold">
                          تخفیف مشتری طلایی ({selectedCustomer.discount_percent}٪):
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          -{' '}
                          {Math.round(
                            (calculatedPrice.total_price * selectedCustomer.discount_percent) / 100
                          ).toLocaleString('fa-IR')}{' '}
                          تومان
                        </span>
                      </div>
                    )}

                    <div className="text-left">
                      <span className="text-slate-500 block text-[11px]">مبلغ نهایی مسافر:</span>
                      <span className="text-base font-black text-teal-700">
                        {(
                          selectedCustomer && selectedCustomer.discount_percent > 0
                            ? calculatedPrice.total_price -
                              Math.round((calculatedPrice.total_price * selectedCustomer.discount_percent) / 100)
                            : calculatedPrice.total_price
                        ).toLocaleString('fa-IR')}{' '}
                        تومان
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-teal-700 font-bold">
                      سهم راننده: {calculatedPrice.driver_share.toLocaleString('fa-IR')} تومان
                    </span>
                    <span className="text-slate-600">
                      کمیسیون آژانس: {calculatedPrice.commission.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewTripOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition"
              >
                تأیید و ثبت نهایی سفر
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* FREQUENT CUSTOMERS DIRECTORY MODAL                        */}
      {/* ======================================================== */}
      {isCustomerDirOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
            {/* Header */}
            <div className="px-5 py-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">دفترچه مشترکین پر سفر و کدهای اشتراک</h3>
                  <p className="text-[11px] text-slate-500">
                    مدیریت مسافرین دارای کد اشتراک، ثبت مشترک جدید و انتخاب سریع جهت اعزام
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت مشترک جدید</span>
                </button>
                <button
                  onClick={() => setIsCustomerDirOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام، شماره تماس، کد اشتراک یا آدرس مسافر..."
                  className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Table / List */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  هیچ مشترکی با این مشخصات یافت نشد.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md text-xs">
                            کد {cust.subscription_code}
                          </span>
                          <strong className="text-slate-900 text-sm">{cust.name}</strong>
                          <span className="font-mono text-slate-500" dir="ltr">
                            {cust.phone}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                            {cust.total_trips} سفر
                          </span>
                          {cust.discount_percent > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {cust.discount_percent}٪ تخفیف
                            </span>
                          )}
                        </div>

                        <div className="text-slate-600 text-[11px] flex flex-col sm:flex-row gap-1 sm:gap-4">
                          <span>
                            <span className="text-slate-400">مبدأ: </span>
                            {cust.address || '—'}
                          </span>
                          <span>
                            <span className="text-slate-400">مقصد متداول: </span>
                            {cust.default_destination || '—'}
                          </span>
                        </div>

                        {cust.notes && (
                          <div className="text-[10px] text-amber-700">
                            {cust.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectCustomerForTrip(cust)}
                        className="self-end sm:self-center px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 whitespace-nowrap"
                      >
                        <span>انتخاب و اعزام سفر</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>تعداد کل مشترکین ثبت‌شده: {customers.length} نفر</span>
              <button
                onClick={() => setIsCustomerDirOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD NEW SUBSCRIBER MODAL                                 */}
      {/* ======================================================== */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateNewCustomer}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6"
          >
            <div className="px-5 py-4 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-slate-800 text-sm">ثبت مشترک پر سفر جدید</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addCustomerError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {addCustomerError}
              </div>
            )}

            {addCustomerSuccess && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4" />
                <span>{addCustomerSuccess}</span>
              </div>
            )}

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">کد اشتراک دلخواه (اختیاری)</label>
                  <input
                    type="text"
                    value={newCustomerForm.subscription_code}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, subscription_code: e.target.value })}
                    placeholder="خودکار تخصیص می‌یابد (مثال: ۱۰۹)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">درصد تخفیف وفاداری</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newCustomerForm.discount_percent}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, discount_percent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    placeholder="مثال: آقای کرمی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">شماره موبایل *</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    placeholder="0916xxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-left font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">آدرس دقیق مبدأ همیشگی</label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  placeholder="خرم‌آباد، روستای بهرامی..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">مقصد پیش‌فرض / متداول</label>
                <input
                  type="text"
                  value={newCustomerForm.default_destination}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, default_destination: e.target.value })}
                  placeholder="میدان شهدا، بیمارستان و..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">توضیحات و ترجیحات مسافر</label>
                <input
                  type="text"
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                  placeholder="مثال: مسافر دائمی صندلی جلو، هماهنگی ۵ دقیقه قبل"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition"
              >
                ثبت و صدور کارت اشتراک
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
