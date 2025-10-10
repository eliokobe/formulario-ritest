"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderSchema, type WorkOrderFormData } from '@/lib/validations';
import { FileUpload } from '@/components/ui/file-upload';
import { CameraCapture } from '@/components/ui/camera-capture';
import { uploadFiles } from '@/lib/upload';
import { useToast } from '@/hooks/useToastClient';
import { Toast } from '@/components/ui/toast';
import { ChevronLeft, ChevronRight, CheckCircle, Building2, Wrench, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const steps = [
  { id: 1, title: 'Datos Generales', icon: Building2 },
  { id: 2, title: 'Reparación', icon: Wrench },
  { id: 3, title: 'Documentación', icon: Camera },
];

export default function WorkOrderPage() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(!!recordId);
  const [reparacionData, setReparacionData] = useState<any>(null);
  const { toast, showToast, hideToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    reset,
    watch,
    setValue,
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    mode: 'onChange',
  });

  // Cargar datos de Airtable si hay recordId
  useEffect(() => {
    if (recordId) {
      const loadReparacionData = async () => {
        try {
          setIsLoadingData(true);
          
          // Modo de prueba: usar datos simulados si el recordId es conocido
          if (recordId === 'recNLQJv5V3qMPvRZ' || recordId === 'recvMhaeHZ1Gu2ot8' || recordId === 'recae5A25aLJsuzHB') {
            // Datos simulados basados en tu tabla de Airtable
            const mockData = {
              'recNLQJv5V3qMPvRZ': {
                Cliente: 'Antonio Pushades Año',
                Dirección: 'Antonio Pushades Año',
                Técnico: 'Juan Carlos'
              },
              'recvMhaeHZ1Gu2ot8': {
                Cliente: 'Pere Vicenç Balfegó Brull',
                Dirección: 'Pere Vicenç Balfegó Brull',
                Técnico: 'Marc'
              },
              'recae5A25aLJsuzHB': {
                Cliente: 'Jose González Fernandez',
                Dirección: 'Santa Olalla',
                Técnico: 'Juan Carlos'
              }
            };

            const data = mockData[recordId as keyof typeof mockData];
            if (data) {
              setReparacionData(data);
              setValue('Cliente', data.Cliente);
              setValue('Dirección', data.Dirección);
              setValue('Técnico', data.Técnico);
              showToast('Datos cargados desde modo de prueba', 'success');
            }
          } else {
            // Intentar cargar desde Airtable
            const response = await fetch(`/api/reparaciones?recordId=${recordId}`);
            
            if (!response.ok) {
              throw new Error('No se pudieron cargar los datos de la reparación');
            }
            
            const data = await response.json();
            setReparacionData(data);
            
            // Precargar los campos del formulario
            setValue('Cliente', data.Cliente || '');
            setValue('Dirección', data.Dirección || '');
            setValue('Técnico', data.Técnico || '');
            
            showToast('Datos cargados desde Airtable', 'success');
          }
          
        } catch (error) {
          console.error('Error cargando datos de reparación:', error);
          showToast('Error cargando datos. Usando modo manual.', 'error');
        } finally {
          setIsLoadingData(false);
        }
      };

      loadReparacionData();
    }
  }, [recordId, setValue, showToast]);

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): (keyof WorkOrderFormData)[] => {
    const watchProblemSolved = watch('¿Has conseguido solucionar el problema?');
    const watchWhatDid = watch('¿Qué has tenido que hacer?');
    
    switch (step) {
      case 1:
        return ['Cliente', 'Dirección', 'Técnico'];
      case 2:
        const fieldsStep2: (keyof WorkOrderFormData)[] = ['¿Has conseguido solucionar el problema?'];
        
        if (watchProblemSolved === 'Reparado') {
          fieldsStep2.push('¿Qué has tenido que hacer?');
          
          if (watchWhatDid === 'Repara el cuadro eléctrico') {
            fieldsStep2.push('¿Qué has tenido que reparar del cuadro eléctrico?');
          }
        } else if (watchProblemSolved === 'Sin reparar') {
          fieldsStep2.push('¿Qué problema has tenido?');
        }
        
        return fieldsStep2;
      case 3:
        return [];
      default:
        return [];
    }
  };

  const onSubmit = async (data: WorkOrderFormData) => {
    console.log('Parte de trabajo enviado con datos:', data);
    
    if (photoFiles.length === 0) {
      showToast('La foto del punto de recarga es requerida', 'error');
      return;
    }
    if (invoiceFiles.length === 0) {
      showToast('La factura del servicio es requerida', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Iniciando carga de archivos...');
      // Upload files
      const [photoUploads, invoiceUploads] = await Promise.all([
        uploadFiles(photoFiles),
        uploadFiles(invoiceFiles),
      ]);
      
      console.log('Archivos cargados:', { photoUploads, invoiceUploads });

      // Prepare data for Airtable
      const workOrderData: Record<string, any> = {
        ...data,
        'Foto punto de recarga': photoUploads,
        'Factura del servicio': invoiceUploads,
      };

      // Si hay recordId, incluirlo para actualizar el registro existente
      if (recordId) {
        workOrderData.recordId = recordId;
      }
      
      console.log('Datos preparados para enviar:', workOrderData);

      // Submit to API
      console.log('Enviando datos a /api/work-orders...');
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workOrderData),
      });

      console.log('Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        try {
          const err = await response.json();
          console.error('Error de la API:', err);
          showToast(typeof err?.error === 'string' ? err.error : 'No se pudo crear la parte de trabajo', 'error');
        } catch (parseError) {
          console.error('Error al parsear respuesta de error:', parseError);
          showToast('No se pudo crear la parte de trabajo', 'error');
        }
        return;
      }

      console.log('Parte de trabajo creado exitosamente');
      setIsCompleted(true);
      showToast('¡Parte de trabajo enviado exitosamente!', 'success');
    } catch (error: any) {
      console.error('Error completo:', error);
      showToast(typeof error?.message === 'string' ? error.message : 'Error al enviar los datos. Inténtalo de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    reset();
    setCurrentStep(1);
    setIsCompleted(false);
    setPhotoFiles([]);
    setInvoiceFiles([]);
    window.location.href = '/';
  };

  if (isCompleted) {
    return (
      <>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              ¡Gracias!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              Hemos recibido tu parte de trabajo exitosamente.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleBackToHome}
              className="bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Volver al Inicio
            </motion.button>
          </motion.div>
        </div>
  <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-4">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="h-12 w-auto"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Parte de Trabajo</h1>
              <p className="text-gray-600">Completa la información del servicio técnico</p>
            </motion.div>

            {/* Progress Steps */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        backgroundColor: currentStep >= step.id ? '#008606' : '#374151',
                        scale: currentStep === step.id ? 1.1 : 1,
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mb-2 shadow-lg"
                    >
                      <step.icon className="w-5 h-5" />
                    </motion.div>
                    <span className="text-xs text-gray-600 text-center max-w-20">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos Generales</h2>
                      
                      {isLoadingData ? (
                        <div className="space-y-6">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-12 bg-gray-200 rounded-xl"></div>
                          </div>
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-12 bg-gray-200 rounded-xl"></div>
                          </div>
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-12 bg-gray-200 rounded-xl"></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cliente *
                            </label>
                            <input
                              {...register('Cliente')}
                              readOnly={!!recordId}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                                !!recordId && "bg-gray-50 cursor-not-allowed",
                                errors.Cliente 
                                  ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                  : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                              )}
                              placeholder="Nombre del cliente"
                            />
                            {errors.Cliente && (
                              <p className="text-red-600 text-sm mt-1">{errors.Cliente.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dirección *
                            </label>
                            <input
                              {...register('Dirección')}
                              readOnly={!!recordId}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                                !!recordId && "bg-gray-50 cursor-not-allowed",
                                errors.Dirección 
                                  ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                  : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                              )}
                              placeholder="Dirección completa del cliente"
                            />
                            {errors.Dirección && (
                              <p className="text-red-600 text-sm mt-1">{errors.Dirección.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Técnico *
                            </label>
                            <input
                              {...register('Técnico')}
                              readOnly={!!recordId}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                                !!recordId && "bg-gray-50 cursor-not-allowed",
                                errors.Técnico 
                                  ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                  : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                              )}
                              placeholder="Nombre del técnico"
                            />
                            {errors.Técnico && (
                              <p className="text-red-600 text-sm mt-1">{errors.Técnico.message}</p>
                            )}
                          </div>

                          {recordId && reparacionData && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                              <p className="text-sm text-green-700">
                                <strong>Información cargada desde Airtable:</strong> Los datos generales se han cargado automáticamente del registro de reparación {recordId.substring(0, 8)}...
                              </p>
                            </div>
                          )}
                        </>
                      )}
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reparación</h2>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ¿Has conseguido solucionar el problema? *
                        </label>
                        <select
                          {...register('¿Has conseguido solucionar el problema?')}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors['¿Has conseguido solucionar el problema?'] 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                          )}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Reparado">Reparado</option>
                          <option value="Sin reparar">Sin reparar</option>
                        </select>
                        {errors['¿Has conseguido solucionar el problema?'] && (
                          <p className="text-red-600 text-sm mt-1">{errors['¿Has conseguido solucionar el problema?']?.message}</p>
                        )}
                      </div>

                      {watch('¿Has conseguido solucionar el problema?') === 'Reparado' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ¿Qué has tenido que hacer? *
                          </label>
                          <select
                            {...register('¿Qué has tenido que hacer?')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors['¿Qué has tenido que hacer?'] 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                            )}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Repara el cuadro eléctrico">Repara el cuadro eléctrico</option>
                            <option value="Resetear la placa electrónica">Resetear la placa electrónica</option>
                            <option value="Sustituir el punto de recarga">Sustituir el punto de recarga</option>
                            <option value="Revisar la instalación">Revisar la instalación</option>
                          </select>
                          {errors['¿Qué has tenido que hacer?'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['¿Qué has tenido que hacer?']?.message}</p>
                          )}
                        </div>
                      )}

                      {watch('¿Qué has tenido que hacer?') === 'Repara el cuadro eléctrico' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ¿Qué has tenido que reparar del cuadro eléctrico? *
                          </label>
                          <select
                            {...register('¿Qué has tenido que reparar del cuadro eléctrico?')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors['¿Qué has tenido que reparar del cuadro eléctrico?'] 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                            )}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Diferencial">Diferencial</option>
                            <option value="Sobretensiones">Sobretensiones</option>
                            <option value="Magneto termico">Magneto termico</option>
                            <option value="Cableado interno">Cableado interno</option>
                            <option value="Gestor dinámico de pontecia">Gestor dinámico de pontecia</option>
                            <option value="Medidor de consumo">Medidor de consumo</option>
                          </select>
                          {errors['¿Qué has tenido que reparar del cuadro eléctrico?'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['¿Qué has tenido que reparar del cuadro eléctrico?']?.message}</p>
                          )}
                        </div>
                      )}

                      {watch('¿Has conseguido solucionar el problema?') === 'Sin reparar' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ¿Qué problema has tenido? *
                          </label>
                          <textarea
                            {...register('¿Qué problema has tenido?')}
                            rows={4}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors['¿Qué problema has tenido?'] 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                            )}
                            placeholder="Describe detalladamente el problema que has encontrado..."
                          />
                          {errors['¿Qué problema has tenido?'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['¿Qué problema has tenido?']?.message}</p>
                          )}
                        </div>
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentación</h2>
                      
                      <CameraCapture
                        label="Foto del punto de recarga ya reparado"
                        required
                        onFileSelect={setPhotoFiles}
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                        }}
                        maxFiles={1}
                        maxSize={10 * 1024 * 1024}
                      />

                      <CameraCapture
                        label="Adjunta la factura del servicio"
                        required
                        onFileSelect={setInvoiceFiles}
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
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
                      currentStep === 1 || isSubmitting
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Atrás
                  </button>

          {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
            disabled={isSubmitting}
                      className="flex items-center gap-2 bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Avanzar
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={() => console.log('Botón enviar clickeado')}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-300 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      
  <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </>
  );
}