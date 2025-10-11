"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import { 
  Loader2, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Camera,
  AlertTriangle,
  Wrench,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';

const steps = [
  { id: 1, title: 'Foto General', icon: Camera },
  { id: 2, title: 'Foto Etiqueta', icon: Camera },
  { id: 3, title: 'Problema', icon: AlertTriangle },
  { id: 4, title: 'Detalles', icon: MessageSquare },
  { id: 5, title: 'Foto Roto', icon: Camera },
];

const problemOptions = [
  'Cargador no carga',
  'Cargador no enciende',
  'Soporte roto físicamente',
  'Manguera roto físicamente',
  'Cargador roto físicamente',
  'Otro'
];

const physicalDamageOptions = [
  'Soporte roto físicamente',
  'Manguera roto físicamente',
  'Cargador roto físicamente'
];

interface TechnicalSupportFormProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

export function TechnicalSupportForm({ onComplete, onError }: TechnicalSupportFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    problema: '',
    detalles: '', // Siempre presente, no solo para "Otro"
  });
  
  const [files, setFiles] = useState({
    fotoGeneral: [] as File[],
    fotoEtiqueta: [] as File[],
    fotoRoto: [] as File[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (files.fotoGeneral.length === 0) {
          newErrors.fotoGeneral = 'Por favor, adjunta una foto general del punto de recarga';
        }
        break;
        
      case 2:
        if (files.fotoEtiqueta.length === 0) {
          newErrors.fotoEtiqueta = 'Por favor, adjunta una foto de la etiqueta del punto de recarga';
        }
        break;
        
      case 3:
        if (!formData.problema.trim()) {
          newErrors.problema = 'Selecciona el tipo de problema';
        }
        break;
        
      case 4:
        // Siempre requiere detalles
        if (!formData.detalles.trim()) {
          newErrors.detalles = 'Por favor, proporciona más detalles sobre el problema';
        }
        break;
        
      case 5:
        // Si seleccionó daño físico, necesita foto
        if (physicalDamageOptions.includes(formData.problema) && files.fotoRoto.length === 0) {
          newErrors.fotoRoto = 'Por favor, adjunta una foto de lo que está roto';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      // Lógica especial para saltar pasos según las respuestas
      if (currentStep === 4) {
        // Si no es daño físico, enviar directamente
        if (!physicalDamageOptions.includes(formData.problema)) {
          handleSubmit();
          return;
        }
      }
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if ((currentStep === 4 || currentStep === 5) && !validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload files
      let fotoGeneralUploads: any[] = [];
      let fotoEtiquetaUploads: any[] = [];
      let fotoRotoUploads: any[] = [];
      
      if (files.fotoGeneral.length > 0) {
        fotoGeneralUploads = await uploadFiles(files.fotoGeneral);
      }
      if (files.fotoEtiqueta.length > 0) {
        fotoEtiquetaUploads = await uploadFiles(files.fotoEtiqueta);
      }
      if (files.fotoRoto.length > 0) {
        fotoRotoUploads = await uploadFiles(files.fotoRoto);
      }

      const supportData = {
        "Foto general": fotoGeneralUploads,
        "Foto etiqueta": fotoEtiquetaUploads,
        "Problema": formData.problema,
        "Otro": formData.detalles, // Siempre enviar los detalles
        "Foto roto": physicalDamageOptions.includes(formData.problema) ? fotoRotoUploads : undefined,
        "Fecha Solicitud": new Date().toISOString(),
      };

      // Aquí podrías hacer la llamada al API para guardar en Airtable
      // const response = await fetch('/api/technical-support', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(supportData),
      // });

      console.log('Support data:', supportData);
      
      // Simular éxito por ahora
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Error al enviar la solicitud. Inténtalo de nuevo.';
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProblemChange = (problema: string) => {
    setFormData(prev => ({
      ...prev,
      problema
    }));
    
    // Limpiar foto de roto si no es daño físico
    if (!physicalDamageOptions.includes(problema)) {
      setFiles(prev => ({ ...prev, fotoRoto: [] }));
    }
    
    if (errors.problema) {
      setErrors(prev => ({ ...prev, problema: '' }));
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '¿Puedes enviar una foto general del punto de recarga?';
      case 2: return '¿Puedes enviar una foto de la etiqueta del punto de recarga?';
      case 3: return '¿Qué problema estás teniendo?';
      case 4: return 'Por favor, proporciona más detalles';
      case 5: return 'Por favor, envía una foto de lo que está roto';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Logo and Header */}
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
            Asistencia Técnica
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Te ayudamos a resolver el problema con tu punto de recarga
          </p>
        </div>

        {/* Progress Steps Section */}
        <div className="flex items-center justify-between max-w-md sm:max-w-2xl mx-auto overflow-x-auto">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center min-w-0 flex-shrink-0">
              <motion.div
                animate={{
                  backgroundColor: currentStep >= step.id ? '#008606' : '#374151',
                  scale: currentStep === step.id ? 1.1 : 1,
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold mb-2 shadow-lg"
              >
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <span className="text-xs font-medium text-gray-900 text-center max-w-14 sm:max-w-20 leading-tight">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Form Card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20">
        <AnimatePresence mode="wait">
          {/* Step 1: Foto General */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-start sm:items-center gap-2">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#008606] mt-1 sm:mt-0 flex-shrink-0" />
                <span className="leading-relaxed">{getStepTitle()}</span>
              </h2>
              
              <FileUpload
                label="Foto General del Punto de Recarga"
                onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoGeneral: files }))}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                }}
                maxFiles={3}
                maxSize={10 * 1024 * 1024}
              />
              {errors.fotoGeneral && (
                <p className="text-red-600 text-sm mt-2">{errors.fotoGeneral}</p>
              )}
            </motion.div>
          )}

          {/* Step 2: Foto Etiqueta */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-start sm:items-center gap-2">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#008606] mt-1 sm:mt-0 flex-shrink-0" />
                <span className="leading-relaxed">{getStepTitle()}</span>
              </h2>
              
              <FileUpload
                label="Foto de la Etiqueta del Punto de Recarga"
                onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoEtiqueta: files }))}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                }}
                maxFiles={2}
                maxSize={10 * 1024 * 1024}
              />
              {errors.fotoEtiqueta && (
                <p className="text-red-600 text-sm mt-2">{errors.fotoEtiqueta}</p>
              )}
            </motion.div>
          )}

          {/* Step 3: Problema */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-start sm:items-center gap-2">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-[#008606] mt-1 sm:mt-0 flex-shrink-0" />
                <span className="leading-relaxed">{getStepTitle()}</span>
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona el problema que estás experimentando *
                </label>
                <div className="space-y-3">
                  {problemOptions.map((problema) => (
                    <label
                      key={problema}
                      className={cn(
                        "flex items-center p-4 sm:p-5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation",
                        formData.problema === problema
                          ? "border-[#008606] bg-[#008606]/10"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                    >
                      <input
                        type="radio"
                        name="problema"
                        value={problema}
                        checked={formData.problema === problema}
                        onChange={() => handleProblemChange(problema)}
                        className="w-5 h-5 text-[#008606] border-gray-300 focus:ring-[#008606]"
                      />
                      <span className="ml-3 text-sm sm:text-base font-medium text-gray-700">{problema}</span>
                    </label>
                  ))}
                </div>
                {errors.problema && (
                  <p className="text-red-600 text-sm mt-2">{errors.problema}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Detalles */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-start sm:items-center gap-2">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#008606] mt-1 sm:mt-0 flex-shrink-0" />
                <span className="leading-relaxed">{getStepTitle()}</span>
              </h2>

              <div>
                <label htmlFor="detalles" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe más detalles sobre el problema *
                </label>
                <textarea
                  id="detalles"
                  value={formData.detalles}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, detalles: e.target.value }));
                    if (errors.detalles) {
                      setErrors(prev => ({ ...prev, detalles: '' }));
                    }
                  }}
                  rows={5}
                  className={cn(
                    "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md resize-none focus:ring-2",
                    errors.detalles 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                      : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                  )}
                  placeholder="Por favor, describe detalladamente el problema que estás experimentando..."
                />
                {errors.detalles && (
                  <p className="text-red-600 text-sm mt-1">{errors.detalles}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Foto Roto */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-start sm:items-center gap-2">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#008606] mt-1 sm:mt-0 flex-shrink-0" />
                <span className="leading-relaxed">{getStepTitle()}</span>
              </h2>

              <div>
                <FileUpload
                  label="Foto de lo que está roto"
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoRoto: files }))}
                  accept={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  }}
                  maxFiles={3}
                  maxSize={10 * 1024 * 1024}
                />
                {errors.fotoRoto && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoRoto}</p>
                )}
              </div>
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

          <button
            type="button"
            onClick={(currentStep === 4 && !physicalDamageOptions.includes(formData.problema)) || currentStep === 5 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : ((currentStep === 4 && !physicalDamageOptions.includes(formData.problema)) || currentStep === 5) ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Enviar Solicitud
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
