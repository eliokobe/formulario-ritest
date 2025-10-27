"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import { 
  Loader2, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

const steps = [
  { id: 1, title: 'Datos Generales' },
  { id: 2, title: 'Foto General' },
  { id: 3, title: 'Foto Etiqueta' },
  { id: 4, title: 'Problema' },
  { id: 5, title: 'Detalles' },
  { id: 6, title: 'Foto Roto' },
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
  const [recordId, setRecordId] = useState<string>('');
  const [expediente, setExpediente] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);

  const getTotalSteps = () => {
    // Por defecto son 5 pasos
    // Solo se muestra el sexto paso si ya se seleccionó un problema que requiere foto de daño físico
    if (formData.problema && physicalDamageOptions.includes(formData.problema)) {
      return 6;
    }
    return 5;
  };
  
  const [formData, setFormData] = useState({
    cliente: '',
    telefono: '',
    direccion: '',
    problema: '',
    detalles: '', // Siempre presente, no solo para "Otro"
  });
  
  const [files, setFiles] = useState({
    fotoGeneral: [] as File[],
    fotoEtiqueta: [] as File[],
    fotoRoto: [] as File[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del expediente si existe en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const recordParam = urlParams.get('record');
    const expedienteParam = urlParams.get('expediente');
    
    // Priorizar record sobre expediente
    if (recordParam) {
      setRecordId(recordParam);
      loadRecordData(recordParam, 'record');
    } else if (expedienteParam) {
      setExpediente(expedienteParam);
      loadRecordData(expedienteParam, 'expediente');
    }
  }, []);

  const loadRecordData = async (id: string, paramType: 'record' | 'expediente') => {
    try {
      const queryParam = paramType === 'record' ? `record=${id}` : `expediente=${id}`;
      const response = await fetch(`/api/expediente?${queryParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setIsEditMode(true);
        setExistingData(data);
        
        // Prellenar formulario con datos existentes
        setFormData(prev => ({
          ...prev,
          cliente: data.cliente || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          problema: data.problema || '',
          detalles: data.detalles || '',
        }));

        // Prellenar archivos existentes si los hay
        // Nota: Los archivos de Airtable se mostrarían como links, no como File objects
        // Para una implementación completa, necesitarías convertir URLs a File objects
      } else if (response.status === 404) {
        onError(`Registro ${id} no encontrado`);
      }
    } catch (error) {
      console.error('Error cargando registro:', error);
      onError('Error al cargar los datos del registro');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.cliente.trim()) {
          newErrors.cliente = 'El nombre del cliente es requerido';
        }
        if (!formData.telefono.trim()) {
          newErrors.telefono = 'El teléfono es requerido';
        }
        if (!formData.direccion.trim()) {
          newErrors.direccion = 'La dirección es requerida';
        }
        break;
        
      case 2:
        if (files.fotoGeneral.length === 0) {
          newErrors.fotoGeneral = 'Por favor, adjunta una foto general del punto de recarga';
        }
        break;
        
      case 3:
        if (files.fotoEtiqueta.length === 0) {
          newErrors.fotoEtiqueta = 'Por favor, adjunta una foto de la etiqueta del punto de recarga';
        }
        break;
        
      case 4:
        if (!formData.problema.trim()) {
          newErrors.problema = 'Selecciona el tipo de problema';
        }
        break;
        
      case 5:
        // Siempre requiere detalles
        if (!formData.detalles.trim()) {
          newErrors.detalles = 'Por favor, proporciona más detalles sobre el problema';
        }
        break;
        
      case 6:
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
      if (currentStep === 5) {
        // Si no es daño físico, enviar directamente
        if (!physicalDamageOptions.includes(formData.problema)) {
          handleSubmit();
          return;
        }
      }
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if ((currentStep === 5 || currentStep === 6) && !validateStep(currentStep)) return;
    
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
        "Cliente": formData.cliente,
        "Teléfono": formData.telefono,
        "Dirección": formData.direccion,
        "Foto general": fotoGeneralUploads,
        "Foto etiqueta": fotoEtiquetaUploads,
        "Problema": formData.problema,
        "Detalles": formData.detalles, // Mapear a la columna "Detalles"
        "Foto roto": physicalDamageOptions.includes(formData.problema) ? fotoRotoUploads : undefined,
      };

      // Decidir si crear nuevo registro o actualizar existente
      if (isEditMode && (recordId || expediente)) {
        // Actualizar registro existente
        const queryParam = recordId ? `record=${recordId}` : `expediente=${expediente}`;
        const response = await fetch(`/api/expediente?${queryParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supportData),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el registro');
        }

        console.log('Registro actualizado:', supportData);
      } else {
        // Crear nuevo registro (implementación futura si es necesario)
        const response = await fetch('/api/technical-support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supportData),
        });

        if (!response.ok) {
          throw new Error('Error al crear la solicitud');
        }

        console.log('Nueva solicitud creada:', supportData);
      }
      
      onComplete();

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
      case 1: return 'Datos Generales';
      case 2: return '¿Puedes enviar una foto general del punto de recarga?';
      case 3: return '¿Puedes enviar una foto de la etiqueta del punto de recarga?';
      case 4: return '¿Qué problema estás teniendo?';
      case 5: return 'Por favor, proporciona más detalles';
      case 6: return 'Por favor, envía una foto de lo que está roto';
      default: return '';
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center gap-6 max-w-4xl mx-auto px-4 xs:px-6 sm:px-6 lg:px-8 py-6">
      {/* Logo and Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 xs:p-5 sm:p-6 md:p-8 shadow-2xl border border-white/20 landscape-compact"
      >
        {/* Logo and Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/iberdrola-colaborador-oficial.png"
              alt="Colaborador oficial Iberdrola"
              width={180}
              height={70}
              priority
              className="h-auto w-36 sm:w-44 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Formulario de Incidencia
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Completa este formulario en menos de un minuto para recibir asistencia inmediata
          </p>
        </div>

        {/* Progress Steps Section */}
        <div className="max-w-md mx-auto">
          {/* Progress Bar */}
          <div className="flex items-center mb-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <motion.div
                animate={{
                  width: `${(currentStep / getTotalSteps()) * 100}%`
                }}
                transition={{ duration: 0.3 }}
                className="bg-[#008606] h-2 rounded-full"
              />
            </div>
            <span className="ml-3 text-sm font-medium text-gray-600">
              {currentStep} de {getTotalSteps()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Form Card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 xs:p-5 sm:p-6 md:p-8 shadow-2xl border border-white/20 landscape-compact">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="cliente"
                    value={formData.cliente}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.cliente 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Nombre del cliente"
                    onChange={(e) => {
                      if (!isEditMode) {
                        setFormData(prev => ({ ...prev, cliente: e.target.value }));
                        if (errors.cliente) {
                          setErrors(prev => ({ ...prev, cliente: '' }));
                        }
                      }
                    }}
                  />
                </div>
                {errors.cliente && (
                  <p className="text-red-600 text-sm mt-1">{errors.cliente}</p>
                )}
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="telefono"
                    value={formData.telefono}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.telefono 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Número de teléfono"
                    onChange={(e) => {
                      if (!isEditMode) {
                        setFormData(prev => ({ ...prev, telefono: e.target.value }));
                        if (errors.telefono) {
                          setErrors(prev => ({ ...prev, telefono: '' }));
                        }
                      }
                    }}
                  />
                </div>
                {errors.telefono && (
                  <p className="text-red-600 text-sm mt-1">{errors.telefono}</p>
                )}
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="direccion"
                    value={formData.direccion}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.direccion 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Dirección del cliente"
                    onChange={(e) => {
                      if (!isEditMode) {
                        setFormData(prev => ({ ...prev, direccion: e.target.value }));
                        if (errors.direccion) {
                          setErrors(prev => ({ ...prev, direccion: '' }));
                        }
                      }
                    }}
                  />
                </div>
                {errors.direccion && (
                  <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Foto General */}
          {currentStep === 2 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>
              
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Toca aquí para tomar una foto o seleccionar una imagen de tu galería
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoGeneral: files }))}
                  accept={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  }}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                />
                {errors.fotoGeneral && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoGeneral}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Foto Etiqueta */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>
              
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Busca la etiqueta con el número de serie y toma una foto clara
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoEtiqueta: files }))}
                  accept={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  }}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                />
                {errors.fotoEtiqueta && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoEtiqueta}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Problema */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <fieldset>
                <legend className="sr-only">
                  Selecciona el problema que estás experimentando *
                </legend>
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
              </fieldset>
            </motion.div>
          )}

          {/* Step 5: Detalles */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <div>
                <label htmlFor="detalles" className="sr-only">
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
                  placeholder=""
                />
                {errors.detalles && (
                  <p className="text-red-600 text-sm mt-1">{errors.detalles}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 6: Foto Roto */}
          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Enfoca la parte dañada para que podamos evaluar el problema
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoRoto: files }))}
                  accept={{
                    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  }}
                  maxFiles={1}
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
  <div className="flex flex-row items-center justify-between gap-3 flex-wrap mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={cn(
              "flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-200 touch-manipulation",
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
            onClick={(currentStep === 5 && !physicalDamageOptions.includes(formData.problema)) || currentStep === 6 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : ((currentStep === 5 && !physicalDamageOptions.includes(formData.problema)) || currentStep === 6) ? (
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
