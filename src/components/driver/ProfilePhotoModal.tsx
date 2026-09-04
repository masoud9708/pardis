import React, { useState, useRef, DragEvent } from 'react';
import { X, UploadCloud, Camera, Image as ImageIcon, CheckCircle, Trash2, Sparkles, Loader2 } from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  driverName?: string;
  onSave: (avatarDataUrl: string) => Promise<void>;
}

// Preset driver portraits for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80',
];

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  driverName = 'راننده',
  onSave,
}) => {
  const [preview, setPreview] = useState<string>(currentAvatar || '');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compress & resize image to max 500x500 for crisp, fast Base64 storage
  const processImageFile = (file: File) => {
    setError('');
    setSuccess(false);

    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویری معتبر (JPG، PNG، WebP) انتخاب نمایید.');
      return;
    }

    // Limit original file size to max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم فایل انتخابی بیش از ۱۰ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب فرمایید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        // Crop to square from center
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreview(compressedDataUrl);
        } else {
          setPreview(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('خطا در خواندن فایل تصویری.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleSelectPreset = (url: string) => {
    setPreview(url);
    setError('');
  };

  const handleRemovePhoto = () => {
    setPreview('');
    setError('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(preview);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 900);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت تصویر پروفایل.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">تصویر پروفایل راننده</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{driverName} - تاکسی پردیس</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="font-bold">خطا:</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تصویر پروفایل با موفقیت ثبت و ذخیره شد.</span>
            </div>
          )}

          {/* Current / New Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-teal-100 border-2 border-teal-500 overflow-hidden bg-slate-100 flex items-center justify-center shadow-md">
                {preview ? (
                  <img
                    src={preview}
                    alt={driverName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-10 h-10 stroke-1" />
                    <span className="text-[10px] mt-1 font-medium">بدون تصویر</span>
                  </div>
                )}
              </div>

              {preview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  title="حذف تصویر"
                  className="absolute bottom-1 right-1 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              پیش‌نمایش تصویر در نقشه ناوبری و پنل مسافران
            </p>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              بارگذاری تصویر از دستگاه (عکس دوربین یا گالری)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/80 bg-slate-50/30'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-teal-100/70 text-teal-700 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  فایل تصویر را بکشید و اینجا رها کنید، یا <span className="text-teal-600 underline">انتخاب فایل</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  پشتیبانی از JPG، PNG و WebP (فشرده‌سازی خودکار و بهینه‌سازی کادر)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Quick Camera Snapshot Button (Mobile friendly) */}
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span>گرفتن عکس فوری با دوربین</span>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Ready Preset Avatars */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>یا انتخاب از تصاویر آماده ناوگان:</span>
              </label>
              <span className="text-[10px] text-slate-400">آواتارهای استاندارد</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((url, idx) => {
                const isSelected = preview === url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition cursor-pointer group ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-200 scale-95'
                        : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`آواتار ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-700/30 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>ذخیره و ثبت تصویر</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
