"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RepairForm } from '@/components/RepairForm';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function RepairPage() {
  const searchParams = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Get URL parameters for pre-filling
  const [prefilledData, setPrefilledData] = useState({
    tecnico: '',
    cliente: '',
    direccion: '',
    record: ''
  });

  useEffect(() => {
    // Read URL parameters
    const urlParams = {
      tecnico: searchParams.get('tecnico') || '',
      cliente: searchParams.get('cliente') || '',
      direccion: searchParams.get('direccion') || '',
      record: searchParams.get('record') || ''
    };
    
    setPrefilledData(urlParams);
    
    // Show info if data was pre-filled
    if (urlParams.tecnico || urlParams.cliente || urlParams.direccion) {
      showToast('Datos prellenados desde Airtable', 'success');
    }
  }, [searchParams, showToast]);

  const handleRepairComplete = () => {
    setIsCompleted(true);
    showToast('¡Reparación guardada exitosamente!', 'success');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsCompleted(false);
      // Optionally reload or redirect
      window.location.reload();
    }, 3000);
  };

  const handleRepairError = (error: string) => {
    showToast(error, 'error');
  };

  if (isCompleted) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-t from-[#008606] to-black flex items-center justify-center p-4">
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
              ¡Reparación Guardada!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-4"
            >
              La información de la reparación ha sido guardada exitosamente en Airtable.
            </motion.p>
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
      <div className="min-h-screen bg-gradient-to-t from-[#008606] to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8"
            >
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
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Wrench className="w-8 h-8 text-[#008606]" />
                    Formulario de Reparación
                  </h1>
                  <p className="text-gray-600">Registra los detalles de la reparación realizada</p>
                </div>
              </div>
              
              {(prefilledData.tecnico || prefilledData.cliente || prefilledData.direccion) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-[#008606] rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Datos prellenados:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    {prefilledData.tecnico && <p><strong>Técnico:</strong> {prefilledData.tecnico}</p>}
                    {prefilledData.cliente && <p><strong>Cliente:</strong> {prefilledData.cliente}</p>}
                    {prefilledData.direccion && <p><strong>Dirección:</strong> {prefilledData.direccion}</p>}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Repair Form */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RepairForm
                onRepairComplete={handleRepairComplete}
                onRepairError={handleRepairError}
                prefilledData={prefilledData}
              />
            </motion.div>
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
