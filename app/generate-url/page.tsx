"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Plus, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function GenerateUrlPage() {
  const [recordIds, setRecordIds] = useState<string[]>(['']);
  const [generatedUrls, setGeneratedUrls] = useState<Array<{recordId: string, url: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const addRecordIdField = () => {
    setRecordIds([...recordIds, '']);
  };

  const removeRecordIdField = (index: number) => {
    if (recordIds.length > 1) {
      const newRecordIds = recordIds.filter((_, i) => i !== index);
      setRecordIds(newRecordIds);
    }
  };

  const updateRecordId = (index: number, value: string) => {
    const newRecordIds = [...recordIds];
    newRecordIds[index] = value;
    setRecordIds(newRecordIds);
  };

  const generateUrls = async () => {
    const validRecordIds = recordIds.filter(id => id.trim() !== '');
    
    if (validRecordIds.length === 0) {
      alert('Por favor ingresa al menos un Record ID');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: validRecordIds,
          baseUrl: window.location.origin
        }),
      });

      if (!response.ok) {
        throw new Error('Error generando URLs');
      }

      const data = await response.json();
      setGeneratedUrls(data.urls);
    } catch (error) {
      console.error('Error:', error);
      alert('Error generando las URLs');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  return (
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Generador de URLs</h1>
            <p className="text-gray-600">Genera URLs únicas para partes de trabajo de Airtable</p>
          </motion.div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Record IDs de Airtable</h2>
            
            <div className="space-y-4 mb-6">
              {recordIds.map((recordId, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={recordId}
                    onChange={(e) => updateRecordId(index, e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all duration-200"
                    placeholder="rec1234567890abcd"
                  />
                  {recordIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecordIdField(index)}
                      className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={addRecordIdField}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Agregar Record ID
              </button>
            </div>

            <button
              onClick={generateUrls}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Generar URLs
                </>
              )}
            </button>
          </motion.div>

          {/* Generated URLs */}
          {generatedUrls.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">URLs Generadas</h2>
              
              <div className="space-y-4">
                {generatedUrls.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Record ID: {item.recordId}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(item.url, index)}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200",
                            copiedIndex === index
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openInNewTab(item.url)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <code className="text-sm text-gray-800 break-all">
                        {item.url}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Copia las URLs generadas</li>
                  <li>2. Ve a tu tabla "Reparaciones" en Airtable</li>
                  <li>3. Crea una columna llamada "Reparación" (si no existe)</li>
                  <li>4. Pega cada URL en la fila correspondiente</li>
                  <li>5. Los técnicos podrán hacer clic en el enlace para completar el parte de trabajo</li>
                </ol>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
