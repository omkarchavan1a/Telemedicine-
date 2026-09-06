import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface JpgAvatarUploaderProps {
  currentAvatar?: string;
  onAvatarChange: (base64DataUrl: string) => void;
  label?: string;
  sublabel?: string;
  idPrefix?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'circle';
  fallbackName?: string;
}

export const JpgAvatarUploader: React.FC<JpgAvatarUploaderProps> = ({
  currentAvatar,
  onAvatarChange,
  label = 'Profile Display Picture (JPG)',
  sublabel = 'JPG format recommended. Drag & drop or click to upload.',
  idPrefix = 'avatar-uploader',
  size = 'md',
  shape = 'rounded',
  fallbackName = 'User',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successPing, setSuccessPing] = useState(false);

  // Dimension classes based on size prop
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  }[size];

  const roundedClasses = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // Process and convert image to optimized JPG Data URL using HTML5 Canvas
  const processImageFile = (file: File) => {
    setErrorMsg(null);

    // Validate mime type and file extension
    const isJpg =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isJpg) {
      setErrorMsg('Please upload a JPG / JPEG format image file.');
      return;
    }

    // Limit to 6MB max raw file
    if (file.size > 6 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 6MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Create an image element to downscale & export strictly as clean JPEG
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400; // 400x400 max resolution for avatar DP
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as JPEG with 0.88 quality
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onAvatarChange(jpgDataUrl);
          setSuccessPing(true);
          setTimeout(() => setSuccessPing(false), 2000);
        } else {
          onAvatarChange(result);
        }
      };
      img.onerror = () => {
        setErrorMsg('Unable to process this image. Please choose another JPG file.');
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Set fallback default placeholder
    onAvatarChange('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-1.5" id={`${idPrefix}-container`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">{label}</label>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            JPG Format
          </span>
        </div>
      )}

      <div
        id={`${idPrefix}-dropzone`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerPicker}
        className={`relative group p-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-4 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
            : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white'
        }`}
      >
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          id={`${idPrefix}-file-input`}
          type="file"
          accept=".jpg,.jpeg,image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Avatar Display Frame */}
        <div className="relative shrink-0">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={fallbackName}
              className={`${sizeClasses} ${roundedClasses} object-cover ring-2 ring-white shadow-xs`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`${sizeClasses} ${roundedClasses} bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shadow-xs`}
            >
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}

          {/* Camera Badge Overlay */}
          <div
            className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-xs text-white transition-transform group-hover:scale-110 ${
              successPing ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          >
            {successPing ? <Check className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
          </div>
        </div>

        {/* Info & Call to Action */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {currentAvatar ? 'Change JPG Photo' : 'Upload Display Picture'}
            </span>
            <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>

          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sublabel}</p>

          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              id={`${idPrefix}-browse-btn`}
              onClick={(e) => {
                e.stopPropagation();
                triggerPicker();
              }}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
            >
              Select JPG from device
            </button>

            {currentAvatar && (
              <button
                type="button"
                id={`${idPrefix}-remove-btn`}
                onClick={handleClear}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
