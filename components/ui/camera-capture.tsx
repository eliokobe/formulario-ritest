"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onFileSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function CameraCapture({
  onFileSelect,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  },
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  label,
  required,
  error,
}: CameraCaptureProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCapture = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false,
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara. Por favor, usa la opción de subir archivo.');
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `foto-${timestamp}.jpg`, {
          type: 'image/jpeg',
        });

        const newFiles = [file];
        setFiles(newFiles);
        onFileSelect(newFiles);
        stopCapture();
      }
    }, 'image/jpeg', 0.9);
  }, [onFileSelect, stopCapture]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      const validFiles = selectedFiles.slice(0, maxFiles).filter(file => {
        if (file.size > maxSize) {
          alert(`El archivo ${file.name} es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`);
          return false;
        }
        return true;
      });

      setFiles(validFiles);
      onFileSelect(validFiles);
    }
  }, [maxFiles, maxSize, onFileSelect]);

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
      
      {!isCapturing && files.length === 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={startCapture}
            className={cn(
              "w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              "border-green-300 hover:border-green-400 bg-green-50 hover:bg-green-100",
              error && "border-red-300 bg-red-50"
            )}
          >
            <Camera className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-medium mb-1">Tomar foto con cámara</p>
            <p className="text-xs text-green-600">
              Haz clic para abrir la cámara
            </p>
          </button>

          <div className="text-center text-gray-500 text-sm">o</div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              "border-gray-300 hover:border-gray-400",
              error && "border-red-300 bg-red-50"
            )}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-1">
              <span className="text-blue-600 font-medium">Seleccionar archivo</span>
            </p>
            <p className="text-xs text-gray-500">
              Máximo {maxFiles} archivo{maxFiles > 1 ? 's' : ''}, hasta {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={Object.values(accept).flat().join(',')}
            onChange={handleFileInput}
            className="hidden"
            multiple={maxFiles > 1}
          />
        </div>
      )}

      {isCapturing && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex items-center gap-2 bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              <Camera className="w-4 h-4" />
              Capturar
            </button>
            
            <button
              type="button"
              onClick={stopCapture}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {file.type.startsWith('image/') && (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <span className="text-sm text-gray-700 block">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  onFileSelect([]);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Tomar nueva foto"
              >
                <RotateCcw className="w-4 h-4" />
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
