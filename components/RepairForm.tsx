"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import { 
  Loader2, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Building2, 
  Settings, 
  FileImage 
} from 'lucide-react';
import { serviciosOptions, cuadroElectricoOptions } from '@/lib/repair-options';
import Image from 'next/image';

const steps = [
  { id: 1, title: 'Datos Generales', icon: Building2 },
  { id: 2, title: 'Reparación', icon: Settings },
  { id: 3, title: 'Documentación', icon: FileImage },
];

interface RepairFormProps {
  onRepairComplete: () => void;
  onRepairError: (error: string) => void;
}

export function RepairForm({ 
  onRepairComplete,
  onRepairError
}: RepairFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Datos Generales
    cliente: '',
    direccion: '',
    tecnico: '',
    
    // Step 2: Reparación
    reparacion: '', // Single option
    cuadroElectrico: '', // Single option
  });
  
  const [files, setFiles] = useState({
    factura: [] as File[],
    foto: [] as File[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.cliente.trim()) {
          newErrors.cliente = 'El nombre del cliente es requerido';
        }
        if (!formData.direccion.trim()) {
          newErrors.direccion = 'La dirección es requerida';
        }
        if (!formData.tecnico.trim()) {
          newErrors.tecnico = 'El técnico es requerido';
        }
        break;
        
      case 2:
        if (!formData.reparacion.trim()) {
          newErrors.reparacion = 'Selecciona el tipo de reparación';
        }
        break;
        
      case 3:
        // Files are optional but we could add validation here if needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload files if any
      let facturaUploads: any[] = [];
      let fotoUploads: any[] = [];
      
      if (files.factura.length > 0) {
        facturaUploads = await uploadFiles(files.factura);
      }
      if (files.foto.length > 0) {
        fotoUploads = await uploadFiles(files.foto);
      }

      const repairData = {
        Reparación: formData.reparacion,
        "Cuadro eléctrico": formData.cuadroElectrico || undefined,
        Técnico: formData.tecnico,
        Cliente: formData.cliente,
        Dirección: formData.direccion,
        Factura: facturaUploads.length > 0 ? facturaUploads : undefined,
        Foto: fotoUploads.length > 0 ? fotoUploads : undefined,
      };

      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData),
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          onRepairError(typeof data?.error === 'string' ? data.error : 'Error al crear la reparación');
        } catch {
          onRepairError('Error al crear la reparación');
        }
        return;
      }

      onRepairComplete();
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Algo salió mal. Inténtalo de nuevo.';
      onRepairError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleReparacionChange = (reparacion: string) => {
    setFormData(prev => ({
      ...prev,
      reparacion,
      // Si no es "Reparar el cuadro eléctrico", limpiar la selección del cuadro
      cuadroElectrico: reparacion === 'Reparar el cuadro eléctrico' ? prev.cuadroElectrico : ''
    }));
    
    if (errors.reparacion) {
      setErrors(prev => ({ ...prev, reparacion: '' }));
    }
  };

  const handleCuadroElectricoChange = (opcion: string) => {
    setFormData(prev => ({
      ...prev,
      cuadroElectrico: opcion
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Logo, Header and Progress Steps Combined */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 mb-4 sm:mb-8"
      >
        {/* Logo and Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={100}
              height={100}
              className="object-contain sm:w-[120px] sm:h-[120px]"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Formulario de Reparación
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Registra los detalles de la reparación realizada
          </p>
        </div>

        {/* Progress Steps Section */}
        <div className="flex items-center justify-between max-w-md sm:max-w-xl mx-auto">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor: currentStep >= step.id ? '#008606' : '#374151',
                  scale: currentStep === step.id ? 1.1 : 1,
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold mb-2 shadow-lg"
              >
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium text-gray-900 text-center max-w-16 sm:max-w-20">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Form Card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20">
        <AnimatePresence mode="wait">
          {/* Step 1: Datos Generales */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#008606]" />
                Datos Generales
              </h2>
              
              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                      errors.cliente 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Nombre del cliente"
                  />
                </div>
                {errors.cliente && (
                  <p className="text-red-600 text-sm mt-1">{errors.cliente}</p>
                )}
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                      errors.direccion 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Dirección del cliente"
                  />
                </div>
                {errors.direccion && (
                  <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>

              <div>
                <label htmlFor="tecnico" className="block text-sm font-medium text-gray-700 mb-2">
                  Técnico *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="tecnico" 
                    value={formData.tecnico}
                    onChange={(e) => handleInputChange('tecnico', e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                      errors.tecnico 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Nombre del técnico"
                  />
                </div>
                {errors.tecnico && (
                  <p className="text-red-600 text-sm mt-1">{errors.tecnico}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Reparación */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#008606]" />
                ¿Qué has tenido que reparar?
              </h2>

              {/* Tipo de Reparación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona el tipo de reparación realizada *
                </label>
                <div className="space-y-3">
                  {serviciosOptions.map((servicio) => (
                    <label
                      key={servicio}
                      className={cn(
                        "flex items-center p-4 sm:p-5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation",
                        formData.reparacion === servicio
                          ? "border-[#008606] bg-[#008606]/10"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                    >
                      <input
                        type="radio"
                        name="reparacion"
                        value={servicio}
                        checked={formData.reparacion === servicio}
                        onChange={() => handleReparacionChange(servicio)}
                        className="w-5 h-5 text-[#008606] border-gray-300 focus:ring-[#008606]"
                      />
                      <span className="ml-3 text-sm sm:text-base font-medium text-gray-700">{servicio}</span>
                    </label>
                  ))}
                </div>
                {errors.reparacion && (
                  <p className="text-red-600 text-sm mt-2">{errors.reparacion}</p>
                )}
              </div>

              {/* Sub-opciones para Cuadro Eléctrico */}
              {formData.reparacion === 'Reparar el cuadro eléctrico' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#008606]"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    ¿Qué has reparado en el cuadro eléctrico?
                  </h3>
                  <div className="space-y-3">
                    {cuadroElectricoOptions.map((opcion) => (
                      <label
                        key={opcion}
                        className={cn(
                          "flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-95 touch-manipulation",
                          formData.cuadroElectrico === opcion
                            ? "border-[#008606] bg-[#008606]/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <input
                          type="radio"
                          name="cuadroElectrico"
                          value={opcion}
                          checked={formData.cuadroElectrico === opcion}
                          onChange={() => handleCuadroElectricoChange(opcion)}
                          className="w-5 h-5 text-[#008606] border-gray-300 focus:ring-[#008606]"
                        />
                        <span className="ml-3 text-sm sm:text-base text-gray-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Documentación */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileImage className="w-6 h-6 text-[#008606]" />
                Documentación
              </h2>
              
              <FileUpload
                label="Foto de lo Reparado"
                onFileSelect={(files) => setFiles(prev => ({ ...prev, foto: files }))}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                }}
                maxFiles={3}
                maxSize={5 * 1024 * 1024}
              />

              <FileUpload
                label="Factura Adjunta"
                onFileSelect={(files) => setFiles(prev => ({ ...prev, factura: files }))}
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.png', '.jpg', '.jpeg'],
                }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-200 touch-manipulation",
              currentStep === 1 || isSubmitting
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:scale-95"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Atrás
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              Avanzar
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-300 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Guardar Reparación
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
