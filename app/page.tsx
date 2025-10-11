"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WorkReport } from '@/components/WorkReport';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';
import { Wrench, CheckCircle, Settings, Users, Calendar } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleRepairComplete = () => {
    setIsCompleted(true);
    showToast('¡Reparación registrada exitosamente!', 'success');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsCompleted(false);
    }, 3000);
  };

  const handleRepairError = (error: string) => {
    showToast(error, 'error');
  };

  if (isCompleted) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-t from-[#1F4D11] to-black flex items-center justify-center p-4">
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
              ¡Reparación Registrada!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-4"
            >
              La información de la reparación ha sido guardada exitosamente.
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
      <div className="min-h-screen bg-gradient-to-t from-[#1F4D11] to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center mb-4">
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
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Parte de Trabajo
                  </h1>
                  <p className="text-green-200">Completar servicio técnico de reparación</p>
                </div>
              </div>
            </motion.div>

            {/* Repair Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <WorkReport
                repairData={{
                  cliente: 'Juan Pérez García',
                  direccion: 'Calle Mayor 123, 28001 Madrid',
                  tecnico: 'María García López'
                }}
                onReportComplete={handleRepairComplete}
                onReportError={handleRepairError}
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