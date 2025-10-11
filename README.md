# Parte de Trabajo - Sistema de Reparaciones

Sistema moderno para gestión de partes de trabajo y reparaciones técnicas, conectado con Airtable. Incluye formularios interactivos para completar servicios técnicos con captura de fotos y documentación.

## Características Principales

- **Interfaz intuitiva**: Diseño responsivo de dos columnas con flujo de 3 pasos
- **Calendario interactivo**: Selección fácil de fechas con navegación mensual
- **Gestión inteligente de horarios**: Slots automáticos L-V, 9:00-17:00, cada 30 min
- **Prevención de conflictos**: Verificación en tiempo real de disponibilidad
- **Manejo de zonas horarias**: Visualización local, almacenamiento en UTC
- **Validación completa**: Formularios con validación en tiempo real
- **Integración Airtable**: Almacenamiento seguro de reservas

## Configuración del Proyecto

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Configuración de Airtable
AIRTABLE_TOKEN=tu_token_de_airtable
AIRTABLE_BASE_ID=tu_base_id
AIRTABLE_TABLE_NAME=Bookings
AIRTABLE_TABLE_CLIENTES=Clientes

# UploadThing (para subida de archivos)
UPLOADTHING_SECRET=tu_uploadthing_secret
UPLOADTHING_APP_ID=tu_uploadthing_app_id
```

### 2. Configuración de Airtable

#### Crear una Base en Airtable:
1. Ve a [Airtable](https://airtable.com) y crea una nueva base
2. Crea dos tablas: "Bookings" y "Clientes"

#### Tabla "Bookings":
Configura las siguientes columnas:
   - `name` (Single line text)
   - `email` (Email)
   - `date_time` (Date with time, formato ISO)

#### Tabla "Clientes":
Configura las siguientes columnas (nombres exactos):
   - `Nombre de la clínica` (Single line text)
   - `Email` (Email)
   - `Teléfono` (Phone number)
   - `Dirección` (Long text)
   - `Horario de atención` (Long text)
   - `¿Tienen más de una sede?` (Single select: Sí, No)
   - `¿Tienen ficha en Google Business?` (Single select: Sí, No)
   - `Enlace a ficha de Google Business` (URL)
   - `Enlace a su web` (URL)
   - `¿Cómo gestionan su agenda actualmente?` (Single line text)
   - `Logo` (Attachment)
   - `Catálogo` (Attachment)
   - `Password` (Single line text)

#### Obtener Token de API:
1. Ve a [Airtable Developer Hub](https://airtable.com/developers/web/api/introduction)
2. Crea un nuevo Personal Access Token
3. Asigna permisos de lectura y escritura para tu base

#### Encontrar Base ID:
1. Abre tu base en Airtable
2. Ve a Help > API documentation
3. El Base ID aparece en la URL y en la documentación

### 3. Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Estructura del Proyecto

```
├── app/
│   ├── api/bookings/route.ts    # API endpoint para reservas
│   ├── api/clientes/route.ts    # API endpoint para clientes
│   ├── onboarding/page.tsx      # Página de onboarding
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Página principal
├── components/
│   ├── ui/toast.tsx            # Sistema de notificaciones
│   ├── ui/file-upload.tsx      # Componente de subida de archivos
│   ├── Calendar.tsx            # Calendario interactivo
│   ├── TimeSlots.tsx           # Selector de horarios
│   └── BookingForm.tsx         # Formulario de reserva
├── hooks/
│   └── use-toast.tsx           # Hook para notificaciones
├── lib/
│   ├── airtable.ts             # Cliente de Airtable
│   ├── validations.ts          # Esquemas de validación Zod
│   ├── upload.ts               # Utilidades de subida de archivos
│   ├── time-utils.ts           # Utilidades de fecha/hora
│   └── utils.ts                # Utilidades generales
└── README.md
```

## API Endpoints

### POST /api/bookings

Crea una nueva reserva después de verificar disponibilidad.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "date_time": "2024-01-15T10:00:00.000Z"
}
```

**Response exitoso (201):**
```json
{
  "id": "rec123456789"
}
```

**Response error - Slot ocupado (409):**
```json
{
  "error": "Time slot is already booked"
}
```

## Funcionalidades Técnicas

### Páginas Disponibles
- `/` - Página principal de reservas (Discovery Meeting)
- `/onboarding` - Formulario multi-paso para registro de clientes

### Gestión de Zonas Horarias
- Detección automática de zona horaria del usuario
- Visualización en horario local
- Almacenamiento en UTC para consistencia global

### Prevención de Conflictos
- Verificación en tiempo real antes de cada reserva
- Uso de `filterByFormula` de Airtable para búsquedas precisas
- Manejo de errores 409 para slots ya ocupados

### Rate Limiting
- Reintentos automáticos en errores 429 de Airtable
- Backoff exponencial para optimizar rendimiento
- Manejo robusto de errores de red

### Validación
- Validación de email con regex
- Validación de URLs para enlaces web
- Validación de archivos (tamaño y tipo)
- Campos obligatorios verificados en frontend y backend
- Sanitización de datos antes del almacenamiento

## Tecnologías Utilizadas

- **Next.js 13+**: Framework React con App Router
- **TypeScript**: Tipado estático para mayor robustez
- **Tailwind CSS**: Framework CSS utilitario
- **Framer Motion**: Animaciones y transiciones suaves
- **React Hook Form**: Manejo de formularios con validación
- **Zod**: Validación de esquemas TypeScript-first
- **React Dropzone**: Componente de drag-and-drop para archivos
- **Airtable API**: Base de datos cloud con API REST
- **date-fns**: Librería para manejo de fechas
- **Lucide React**: Iconos SVG optimizados

## Personalización

### Configurar Subida de Archivos
Para usar UploadThing en producción:
1. Crea una cuenta en [UploadThing](https://uploadthing.com)
2. Obtén tu `UPLOADTHING_SECRET` y `UPLOADTHING_APP_ID`
3. Reemplaza la implementación mock en `lib/upload.ts` con la integración real

### Modificar Horarios de Disponibilidad
Edita `lib/time-utils.ts` para cambiar:
- Horas de inicio/fin (actualmente 9:00-17:00)
- Duración de slots (actualmente 30 minutos)
- Días laborables (actualmente L-V)

### Cambiar Estilos
Los estilos están basados en Tailwind CSS. Modifica las clases en los componentes o personaliza el tema en `tailwind.config.ts`.

### Campos Adicionales
Para agregar campos al formulario de onboarding:
1. Actualiza el esquema en `lib/validations.ts`
2. Modifica la interfaz en `app/onboarding/page.tsx`
3. Ajusta la validación en `app/api/clientes/route.ts`
4. Agrega las columnas correspondientes en la tabla "Clientes" de Airtable

## Notas de Desarrollo

- El proyecto usa exportación estática (`output: 'export'`) para máxima compatibilidad
- Las imágenes están optimizadas para despliegue estático
- ESLint configurado con reglas de Next.js
- Componentes completamente tipados con TypeScript

## Soporte

Para problemas o preguntas técnicas, revisa:
1. Las variables de entorno estén correctamente configuradas
2. Las tablas "Bookings" y "Clientes" existan en Airtable con las columnas exactas
3. Los permisos de Airtable incluyan lectura y escritura
4. Los logs del servidor para errores específicos
5. La configuración de UploadThing para subida de archivos