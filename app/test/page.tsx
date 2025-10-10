"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function TestPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const testRecords = [
    {
      id: 'recNLQJv5V3qMPvRZ',
      cliente: 'Antonio Pushades Año',
      tecnico: 'Juan Carlos',
      direccion: 'Antonio Pushades Año',
      url: `${window.location.origin}/onboarding?recordId=recNLQJv5V3qMPvRZ`
    },
    {
      id: 'recvMhaeHZ1Gu2ot8',
      cliente: 'Pere Vicenç Balfegó Brull',
      tecnico: 'Marc',
      direccion: 'Pere Vicenç Balfegó Brull',
      url: `${window.location.origin}/onboarding?recordId=recvMhaeHZ1Gu2ot8`
    },
    {
      id: 'recae5A25aLJsuzHB',
      cliente: 'Jose González Fernandez',
      tecnico: 'Juan Carlos',
      direccion: 'Santa Olalla',
      url: `${window.location.origin}/onboarding?recordId=recae5A25aLJsuzHB`
    }
  ];

  const copyToClipboard = async (url: string, recordId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(recordId);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Error copiando URL:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[#008606] to-black">
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
            <h1 className="text-3xl font-bold text-white mb-2">Prueba del Sistema</h1>
            <p className="text-gray-300">URLs de prueba para partes de trabajo</p>
          </motion.div>

          {/* Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Sistema Funcionando</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Formulario de Parte de Trabajo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Datos simulados de Airtable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Captura de fotos con cámara</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Conexión real con Airtable (pendiente)</span>
              </div>
            </div>
          </motion.div>

          {/* Test Records */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">URLs de Prueba</h2>
            
            <div className="space-y-4">
              {testRecords.map((record, index) => (
                <div key={record.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{record.cliente}</h3>
                      <p className="text-sm text-gray-600">
                        Técnico: {record.tecnico} • Dirección: {record.direccion}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(record.url, record.id)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200",
                          copiedUrl === record.id
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {copiedUrl === record.id ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar URL
                          </>
                        )}
                      </button>
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-[#008606] text-white hover:bg-[#008606]/90 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Probar
                      </a>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <code className="text-xs text-gray-800 break-all">
                      {record.url}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {/* Modo de Prueba */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Modo de Prueba Activo</h3>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  Las URLs de arriba funcionan con datos simulados mientras se configura la conexión real con Airtable.
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Los datos generales se cargan automáticamente</li>
                  <li>• Los campos aparecen como solo lectura</li>
                  <li>• Se puede completar la reparación y documentación</li>
                  <li>• Las fotos se pueden capturar directamente</li>
                </ul>
              </div>

              {/* Próximos Pasos */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Próximos Pasos</h3>
                </div>
                <p className="text-sm text-green-800 mb-3">
                  Para conectar con Airtable real:
                </p>
                <ol className="text-xs text-green-700 space-y-1">
                  <li>1. Verificar permisos del token de Airtable</li>
                  <li>2. Confirmar nombre exacto de la tabla</li>
                  <li>3. Probar conexión con API test</li>
                  <li>4. Desactivar modo de prueba</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
