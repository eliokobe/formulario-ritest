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
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          error && "border-red-300 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        {isDragActive ? (
          <p className="text-blue-600">Suelta los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-1">
              Arrastra archivos aquí o <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-gray-500">
              Máximo {maxFiles} archivo{maxFiles > 1 ? 's' : ''}, hasta {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <File className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 flex-1">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
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