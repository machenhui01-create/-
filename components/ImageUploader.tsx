import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  onImagesSelected: (base64s: string[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelected, disabled, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const promises = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(images => {
      onImagesSelected(images);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className={`
        w-full border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${compact ? 'py-8' : 'h-64'}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        disabled={disabled}
      />

      <div className="text-center px-4">
        <div className={`bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${compact ? 'w-5 h-5' : 'w-7 h-7'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>批量上传图片</h3>
        {!compact && <p className="text-sm text-gray-500 mt-1">支持多选 / 拖拽上传</p>}
      </div>
    </div>
  );
};