import { z } from 'zod';

export const clientSchema = z.object({
  // Paso 1: Datos generales
  'Nombre de la clínica': z.string().min(1, 'El nombre de la clínica es requerido'),
  Email: z.string().email('Email inválido'),
  Teléfono: z.string().min(1, 'El teléfono es requerido'),
  Dirección: z.string().min(1, 'La dirección es requerida'),
  'Horario de atención': z.string().min(1, 'El horario de atención es requerido'),
  
  // Paso 2: Presencia digital
  '¿Tienen más de una sede?': z.enum(['Sí', 'No'], {
    required_error: 'Selecciona una opción'
  }),
  '¿Tienen ficha en Google Business?': z.enum(['Sí', 'No'], {
    required_error: 'Selecciona una opción'
  }),
  'Enlace a ficha de Google Business': z.string().url('URL inválida').optional().or(z.literal('')),
  'Enlace a su web': z.string().url('URL inválida'),
  '¿Qué calendario usan?': z.string().min(1, 'Este campo es requerido'),
  '¿Cuántos calendario tienen?': z.string().min(1, 'Este campo es requerido'),
  
  // Paso 3: Archivos (handled separately as File objects)
  
  // Paso 4: Seguridad (obligatorio)
  Password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
}).refine((data) => {
  // Validación condicional para Google Business URL
  if (data['¿Tienen ficha en Google Business?'] === 'Sí') {
    const googleBusinessUrl = data['Enlace a ficha de Google Business'];
    if (!googleBusinessUrl || googleBusinessUrl.trim() === '') {
      return false;
    }
    try {
      new URL(googleBusinessUrl);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "El enlace a Google Business es requerido y debe ser una URL válida cuando tienen ficha en Google Business",
  path: ["Enlace a ficha de Google Business"]
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Schema para el formulario "Parte de trabajo"
export const workOrderSchema = z.object({
  // Datos generales
  Cliente: z.string().min(1, 'El cliente es requerido'),
  Dirección: z.string().min(1, 'La dirección es requerida'),
  Técnico: z.string().min(1, 'El técnico es requerido'),
  
  // Reparación
  '¿Has conseguido solucionar el problema?': z.enum(['Reparado', 'Sin reparar'], {
    required_error: 'Selecciona una opción'
  }),
  '¿Qué has tenido que hacer?': z.enum([
    'Repara el cuadro eléctrico',
    'Resetear la placa electrónica',
    'Sustituir el punto de recarga',
    'Revisar la instalación'
  ]).optional(),
  '¿Qué has tenido que reparar del cuadro eléctrico?': z.enum([
    'Diferencial',
    'Sobretensiones',
    'Magneto termico',
    'Cableado interno',
    'Gestor dinámico de pontecia',
    'Medidor de consumo'
  ]).optional(),
  '¿Qué problema has tenido?': z.string().optional(),
}).refine((data) => {
  // Si está reparado, debe seleccionar qué hizo
  if (data['¿Has conseguido solucionar el problema?'] === 'Reparado') {
    return !!data['¿Qué has tenido que hacer?'];
  }
  return true;
}, {
  message: "Debes seleccionar qué has tenido que hacer",
  path: ["¿Qué has tenido que hacer?"]
}).refine((data) => {
  // Si seleccionó "Repara el cuadro eléctrico", debe especificar qué reparó
  if (data['¿Qué has tenido que hacer?'] === 'Repara el cuadro eléctrico') {
    return !!data['¿Qué has tenido que reparar del cuadro eléctrico?'];
  }
  return true;
}, {
  message: "Debes especificar qué reparaste del cuadro eléctrico",
  path: ["¿Qué has tenido que reparar del cuadro eléctrico?"]
}).refine((data) => {
  // Si no está reparado, debe explicar el problema
  if (data['¿Has conseguido solucionar el problema?'] === 'Sin reparar') {
    return !!data['¿Qué problema has tenido?'] && data['¿Qué problema has tenido?'].trim().length > 0;
  }
  return true;
}, {
  message: "Debes explicar qué problema has tenido",
  path: ["¿Qué problema has tenido?"]
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;