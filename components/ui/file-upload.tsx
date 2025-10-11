"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
  },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  label,
  required,
  error,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    onFileSelect(acceptedFiles);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileSelect(newFiles);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors touch-manipulation active:scale-95",
          isDragActive ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-gray-400",
          error && "border-red-300 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
        {isDragActive ? (
          <p className="text-green-600 text-base sm:text-lg font-medium">Suelta los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2 text-base sm:text-lg">
              <span className="block sm:inline">Toca para seleccionar archivos</span>
              <span className="hidden sm:inline"> o arrástralos aquí</span>
            </p>
            <p className="text-sm text-gray-500">
              Máximo {maxFiles} archivo{maxFiles > 1 ? 's' : ''}, hasta {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm sm:text-base text-gray-700 block truncate">{file.name}</span>
                <span className="text-xs sm:text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 p-2 -m-2 touch-manipulation active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}