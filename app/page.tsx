"use client";

import { useState, Fragment, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from '@/components/Calendar';
import { TimeSlots } from '@/components/TimeSlots';
import { BookingForm } from '@/components/BookingForm';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';
import { formatDateForDisplay, getUserTimezone } from '@/lib/time-utils';
import { Clock, MapPin, CheckCircle, User } from 'lucide-react';
import Image from 'next/image';
import { isBefore, startOfDay } from 'date-fns';

type BookingStep = 1 | 2 | 3;

export default function Home() {
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0); // Forzar re-render del calendario
  const { toast, showToast, hideToast } = useToast();

  // RESET COMPLETO cada vez que se carga la página
  useEffect(() => {
    const resetToToday = () => {
      const now = new Date();
      const today = startOfDay(now);
      
      console.log('🔄 App initializing - resetting to today:', today);
      
      // SIEMPRE resetear al estado inicial
      setSelectedDate(null);
      setSelectedTime(null);
      setCurrentStep(1);
      setIsBooked(false);
      
      // Forzar re-render del calendario con nueva key
      setCalendarKey(prev => prev + 1);
    };

    // EJECUTAR INMEDIATAMENTE al cargar la página
    resetToToday();

    // Verificar cada 30 segundos si necesita reset
    const interval = setInterval(() => {
      const now = new Date();
      const today = startOfDay(now);
      
      if (selectedDate && isBefore(selectedDate, today)) {
        console.log('🔄 Selected date is in the past, resetting...');
        resetToToday();
      }
    }, 30000);

    // Verificar cuando el usuario regresa a la pestaña
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Tab became visible, resetting to today...');
        resetToToday();
      }
    };

    // Verificar cuando la ventana gana foco
    const handleFocus = () => {
      console.log('🔄 Window focused, resetting to today...');
      resetToToday();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Solo ejecutar una vez al montar

  const handleCalendarError = (message: string) => {
    showToast(message, 'error', false); // Sin icono para errores de calendario
  };

  const handleDateSelect = (date: Date) => {
    // La validación ya se hizo en el Calendar component
    // Aquí solo procesamos fechas válidas
    setSelectedDate(date);
    setSelectedTime(null);
    setCurrentStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const handleBookingComplete = () => {
    setIsBooked(true);
    showToast('¡Tu reunión ha sido agendada exitosamente!', 'success');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setIsBooked(false);
      setCalendarKey(prev => prev + 1); // Nuevo calendario limpio
    }, 3000);
  };

  const handleBookingError = (error: string) => {
    showToast(error, 'error');
  };

  const goBackToStep = (step: BookingStep) => {
    if (step === 1) {
      setSelectedDate(null);
      setSelectedTime(null);
      setCalendarKey(prev => prev + 1); // Nuevo calendario limpio
    } else if (step === 2) {
      setSelectedTime(null);
    }
    setCurrentStep(step);
  };

  const canProceedToStep2 = selectedDate !== null;
  const canProceedToStep3 = canProceedToStep2 && selectedTime;

  if (isBooked) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-t from-[#0059F1] to-black flex items-center justify-center p-4">
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
              ¡Reserva Confirmada!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-4"
            >
              Tu reunión de descubrimiento ha sido agendada exitosamente.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
            >
              <p className="font-semibold text-gray-900">
                {selectedDate && formatDateForDisplay(selectedDate)}
              </p>
              <p className="text-blue-600 font-medium">{selectedTime}</p>
            </motion.div>
          </motion.div>
        </div>
  {toast.isVisible && (
  <Toast
    message={toast.message}
    type={toast.type}
    isVisible={toast.isVisible}
    onClose={hideToast}
    showIcon={toast.showIcon}
  />
)}
      </>
    );
  }

  return (
    <>
      {/* Banner Superior de Escasez */}
      <div className="bg-gradient-to-r from-[#0059F1] to-blue-700 text-white py-3 px-4 shadow-lg">
        <div className="container mx-auto text-center">
          <p className="text-sm md:text-base font-semibold">
            Solo 2 clínicas nuevas este mes para garantizar resultados · Reserva tu plaza antes de que se agoten
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-t from-[#0059F1] to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Column - Event Details */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20"
              >
                {/* Avatar/Logo */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-4 p-2">
                    <Image
                      src="/favicon.png"
                      alt="Favicon"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Equipo Sonrisia</p>
                    <p className="text-sm text-gray-600">Consultores en IA Dental</p>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Llamada de Descubrimiento
                </h1>
                <p className="text-gray-500 mb-6">Descubre cómo podemos llenar tu agenda en 7 días garantizada y sin costes</p>
                
                <div className="flex items-center gap-3 text-gray-600 mb-3">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">30 minutos</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600 mb-8">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Google Meets</span>
                </div>
                
                <div className="prose prose-gray mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    Reunión exclusiva para clínicas dentales donde te mostraremos el paso a paso para aumentar tus ingresos recuperando pacientes que ya confían en tu clínica de forma gratuita. Además, te explicaremos cómo nuestro modelo de pago por resultados elimina riesgos y convierte cada cita en un ingreso seguro.
                  </p>
                </div>

                {/* Texto de Urgencia */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#0059F1] rounded-lg p-4 mb-8">
                  <p className="text-blue-800 font-medium text-sm">
                    Cada semana que pasa, tus pacientes inactivos se enfrían más y es más probable que no vuelvan.
                  </p>
                </div>

                {/* Progress Indicator */}
                <div>
                  <div className="flex items-center">
                    {[1, 2, 3].map((step, idx) => (
                      <Fragment key={step}>
                        <div className="flex flex-col items-center flex-1 min-w-[90px]">
                          <motion.div
                            animate={{
                              backgroundColor: currentStep >= step ? '#0059F1' : '#e5e7eb',
                              color: currentStep >= step ? '#ffffff' : '#6b7280'
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
                          >
                            {step}
                          </motion.div>
                          <span className="text-xs text-gray-500 mt-2 text-center">
                            {['Seleccionar Fecha', 'Elegir Hora', 'Agendar Cita'][idx]}
                          </span>
                        </div>
                        {step < 3 && (
                          <motion.div
                            animate={{
                              backgroundColor: currentStep > step ? '#0059F1' : '#e5e7eb'
                            }}
                            className="h-0.5 flex-1 mx-2 transition-colors"
                          />
                        )}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Booking Flow */}
            <div className="space-y-6">
              {/* Step Navigation */}
              <AnimatePresence>
                {currentStep > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-wrap gap-2"
                  >
                    {currentStep >= 2 && selectedDate && (
                      <button
                        onClick={() => goBackToStep(1)}
                        className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20 hover:bg-white transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
                      >
                        {formatDateForDisplay(selectedDate)} ✕
                      </button>
                    )}
                    {currentStep === 3 && selectedTime && (
                      <button
                        onClick={() => goBackToStep(2)}
                        className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20 hover:bg-white transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
                      >
                        {selectedTime} ✕
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {/* Step 1: Date Selection */}
                {currentStep === 1 && (
                  <motion.div
                    key={`calendar-${calendarKey}`} // Key única para forzar re-mount
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Calendar 
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      onError={handleCalendarError}
                    />
                  </motion.div>
                )}

                {/* Step 2: Time Selection */}
                {currentStep === 2 && selectedDate && (
                  <motion.div
                    key="timeslots"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TimeSlots
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onTimeSelect={handleTimeSelect}
                    />
                  </motion.div>
                )}

                {/* Step 3: Booking Form */}
                {currentStep === 3 && selectedDate && selectedTime && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BookingForm
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onBookingComplete={handleBookingComplete}
                      onBookingError={handleBookingError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
  {toast.isVisible && (
  <Toast
    message={toast.message}
    type={toast.type}
    isVisible={toast.isVisible}
    onClose={hideToast}
    showIcon={toast.showIcon}
  />
)}
    </>
  );
}