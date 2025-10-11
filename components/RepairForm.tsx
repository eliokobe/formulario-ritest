"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, User, Wrench, Calendar, FileText, DollarSign, Upload, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { serviciosOptions, tecnicosOptions, estadosReparacion } from '@/lib/repair-options';

interface RepairFormProps {
  onRepairComplete: () => void;
  onRepairError: (error: string) => void;
}

export function RepairForm({ 
  onRepairComplete,
  onRepairError 
}: RepairFormProps) {
  const [formData, setFormData] = useState({
    servicios: [] as string[],
    tecnicos: '',
    tecnico: '',
    fechaVisita: '',
    resultado: '',
    reparacion: '',
    problema: '',
    importe: '',
    pagado: false,
    fechaPago: '',
  });
  
  const [files, setFiles] = useState({
    factura: null as File | null,
    foto: null as File | null,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.servicios.length === 0) {
      newErrors.servicios = 'Selecciona al menos un servicio';
    }

    if (!formData.problema.trim()) {
      newErrors.problema = 'Describe el problema';
    }

    if (!formData.fechaVisita) {
      newErrors.fechaVisita = 'Selecciona la fecha de visita';
    }

    if (formData.importe && isNaN(Number(formData.importe))) {
      newErrors.importe = 'El importe debe ser un número válido';
    }

    if (formData.pagado && !formData.fechaPago) {
      newErrors.fechaPago = 'Si está pagado, indica la fecha de pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const repairData = {
        Servicios: formData.servicios,
        Técnicos: formData.tecnicos,
        Técnico: formData.tecnico,
        "Fecha visita": formData.fechaVisita,
        Resultado: formData.resultado,
        Reparación: formData.reparacion,
        Problema: formData.problema,
        Importe: formData.importe ? Number(formData.importe) : undefined,
        Pagado: formData.pagado,
        "Fecha pago": formData.pagado ? formData.fechaPago : undefined,
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
      // Reset form
      setFormData({
        servicios: [],
        tecnicos: '',
        tecnico: '',
        fechaVisita: '',
        resultado: '',
        reparacion: '',
        problema: '',
        importe: '',
        pagado: false,
        fechaPago: '',
      });
      setFiles({ factura: null, foto: null });
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

  const handleServicioToggle = (servicio: string) => {
    setFormData(prev => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter(s => s !== servicio)
        : [...prev.servicios, servicio]
    }));
    
    if (errors.servicios) {
      setErrors(prev => ({ ...prev, servicios: '' }));
    }
  };

  const handleFileChange = (type: 'factura' | 'foto', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 max-w-4xl mx-auto">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Wrench className="w-6 h-6 text-[#008606]" />
        Formulario de Reparación
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Servicios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Servicios Requeridos *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {serviciosOptions.map((servicio) => (
              <label
                key={servicio}
                className={cn(
                  "flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                  formData.servicios.includes(servicio)
                    ? "border-[#008606] bg-[#008606]/10"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.servicios.includes(servicio)}
                  onChange={() => handleServicioToggle(servicio)}
                  className="w-4 h-4 text-[#008606] border-gray-300 rounded focus:ring-[#008606]"
                />
                <span className="ml-2 text-sm text-gray-700">{servicio}</span>
              </label>
            ))}
          </div>
          {errors.servicios && (
            <p className="text-red-600 text-sm mt-2">{errors.servicios}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Técnicos (Dropdown) */}
          <div>
            <label htmlFor="tecnicos" className="block text-sm font-medium text-gray-700 mb-2">
              Técnico Asignado
            </label>
            <select
              id="tecnicos"
              value={formData.tecnicos}
              onChange={(e) => handleInputChange('tecnicos', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
            >
              <option value="">Seleccionar técnico...</option>
              {tecnicosOptions.map((tecnico) => (
                <option key={tecnico} value={tecnico}>{tecnico}</option>
              ))}
            </select>
          </div>

          {/* Técnico (Input libre) */}
          <div>
            <label htmlFor="tecnico" className="block text-sm font-medium text-gray-700 mb-2">
              Técnico (Campo libre)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                id="tecnico"
                value={formData.tecnico}
                onChange={(e) => handleInputChange('tecnico', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                placeholder="Nombre del técnico"
              />
            </div>
          </div>
        </div>

        {/* Fecha de Visita */}
        <div>
          <label htmlFor="fechaVisita" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Visita *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="datetime-local"
              id="fechaVisita"
              value={formData.fechaVisita}
              onChange={(e) => handleInputChange('fechaVisita', e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md",
                errors.fechaVisita 
                  ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              )}
            />
          </div>
          {errors.fechaVisita && (
            <p className="text-red-600 text-sm mt-1">{errors.fechaVisita}</p>
          )}
        </div>

        {/* Problema */}
        <div>
          <label htmlFor="problema" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del Problema *
          </label>
          <div className="relative">
            <AlertCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              id="problema"
              value={formData.problema}
              onChange={(e) => handleInputChange('problema', e.target.value)}
              rows={3}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md resize-none",
                errors.problema 
                  ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              )}
              placeholder="Describe detalladamente el problema..."
            />
          </div>
          {errors.problema && (
            <p className="text-red-600 text-sm mt-1">{errors.problema}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resultado */}
          <div>
            <label htmlFor="resultado" className="block text-sm font-medium text-gray-700 mb-2">
              Resultado de la Reparación
            </label>
            <textarea
              id="resultado"
              value={formData.resultado}
              onChange={(e) => handleInputChange('resultado', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 resize-none"
              placeholder="Describe el resultado obtenido..."
            />
          </div>

          {/* Reparación */}
          <div>
            <label htmlFor="reparacion" className="block text-sm font-medium text-gray-700 mb-2">
              Detalles de la Reparación
            </label>
            <textarea
              id="reparacion"
              value={formData.reparacion}
              onChange={(e) => handleInputChange('reparacion', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 resize-none"
              placeholder="Describe las acciones realizadas..."
            />
          </div>
        </div>

        {/* Importe */}
        <div>
          <label htmlFor="importe" className="block text-sm font-medium text-gray-700 mb-2">
            Importe (€)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="number"
              id="importe"
              value={formData.importe}
              onChange={(e) => handleInputChange('importe', e.target.value)}
              step="0.01"
              min="0"
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md",
                errors.importe 
                  ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              )}
              placeholder="0.00"
            />
          </div>
          {errors.importe && (
            <p className="text-red-600 text-sm mt-1">{errors.importe}</p>
          )}
        </div>

        {/* Estado de Pago */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="pagado"
              checked={formData.pagado}
              onChange={(e) => handleInputChange('pagado', e.target.checked)}
              className="w-4 h-4 text-[#008606] border-gray-300 rounded focus:ring-[#008606]"
            />
            <label htmlFor="pagado" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Reparación Pagada
            </label>
          </div>

          {formData.pagado && (
            <div>
              <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago *
              </label>
              <input
                type="date"
                id="fechaPago"
                value={formData.fechaPago}
                onChange={(e) => handleInputChange('fechaPago', e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md",
                  errors.fechaPago 
                    ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                    : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                )}
              />
              {errors.fechaPago && (
                <p className="text-red-600 text-sm mt-1">{errors.fechaPago}</p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1F4D11] hover:bg-[#1F4D11]/90 disabled:bg-[#1F4D11]/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando Reparación...
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4" />
              Guardar Reparación
            </>
          )}
        </button>
      </form>
    </div>
  );
}
