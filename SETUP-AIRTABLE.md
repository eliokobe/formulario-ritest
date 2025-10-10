# Configuración de Partes de Trabajo con Airtable

## 🚀 Configuración Inicial

### 1. Variables de Entorno
Configura las siguientes variables en tu archivo `.env.local`:

```bash
AIRTABLE_TOKEN=tu_token_personal_de_airtable
AIRTABLE_BASE_ID=appX3CBiSmPy4119D
AIRTABLE_TABLE_REPARACIONES=Reparaciones
```

### 2. Estructura de la Tabla "Reparaciones" en Airtable

Tu tabla debe tener las siguientes columnas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| **Cliente** | Single line text | Nombre del cliente |
| **Dirección** | Long text | Dirección completa |
| **Técnico** | Single line text | Nombre del técnico asignado |
| **Reparación** | Formula | URL generada automáticamente |
| **Estado** | Single select | Pendiente, En Proceso, Completado |
| **¿Has conseguido solucionar el problema?** | Single select | Reparado, Sin reparar |
| **¿Qué has tenido que hacer?** | Single select | Opciones de reparación |
| **¿Qué has tenido que reparar del cuadro eléctrico?** | Single select | Detalles específicos |
| **¿Qué problema has tenido?** | Long text | Descripción del problema |
| **Foto punto de recarga** | Attachment | Foto después de la reparación |
| **Factura del servicio** | Attachment | Factura del trabajo realizado |
| **Fecha de completado** | Date | Fecha de finalización |

### 3. Fórmula para la Columna "Reparación"

En Airtable, crea una columna de tipo **Formula** llamada "Reparación" y usa esta fórmula:

```javascript
"https://tu-dominio.com/onboarding?recordId=" & RECORD_ID()
```

Por ejemplo, para desarrollo local:
```javascript
"http://localhost:3000/onboarding?recordId=" & RECORD_ID()
```

Para producción:
```javascript
"https://mi-app.vercel.app/onboarding?recordId=" & RECORD_ID()
```

## 🔧 Flujo de Trabajo

### Paso 1: Crear Registros en Airtable
1. Ve a tu tabla "Reparaciones" en Airtable
2. Crea un nuevo registro con:
   - **Cliente**: Nombre del cliente
   - **Dirección**: Dirección completa
   - **Técnico**: Técnico asignado
   - **Estado**: "Pendiente"
3. La columna "Reparación" se generará automáticamente con la URL única

### Paso 2: Enviar URL al Técnico
1. Copia la URL de la columna "Reparación"
2. Envíala al técnico por WhatsApp, email, etc.
3. El técnico hace clic y accede al formulario con los datos precargados

### Paso 3: Completar el Parte de Trabajo
1. El técnico ve los datos generales (solo lectura)
2. Completa la sección de reparación
3. Toma fotos directamente con la cámara
4. Envía el formulario

### Paso 4: Actualización Automática
1. Los datos se actualizan automáticamente en Airtable
2. El estado cambia a "Completado"
3. Se guarda la fecha de completado

## 🛠 Generador de URLs

### Opción 1: Usar el Generador Web
1. Ve a `/generate-url` en tu aplicación
2. Ingresa uno o varios Record IDs
3. Genera las URLs automáticamente
4. Copia y pega en Airtable

### Opción 2: Usar la API directamente
```bash
# Para un solo Record ID
curl "http://localhost:3000/api/generate-url?recordId=rec1234567890abcd"

# Para múltiples Record IDs
curl -X POST "http://localhost:3000/api/generate-url" \
  -H "Content-Type: application/json" \
  -d '{"recordIds": ["rec1234567890abcd", "rec0987654321efgh"]}'
```

## 📱 Uso desde Móvil

El formulario está optimizado para móvil y permite:
- Tomar fotos directamente con la cámara del dispositivo
- Subir archivos desde la galería
- Navegación táctil intuitiva
- Validación en tiempo real

## 🔍 Ejemplo de URL Generada

```
https://tu-app.com/onboarding?recordId=rec1234567890abcd
```

Cuando el técnico accede a esta URL:
1. Se cargan automáticamente: Cliente, Dirección, Técnico
2. Los campos aparecen como solo lectura
3. Se muestra un mensaje confirmando la carga desde Airtable
4. El técnico solo completa: Reparación + Documentación

## 🎯 Beneficios

- **Automatización Total**: Los datos se sincronizan automáticamente
- **Sin Errores**: Los datos generales no se pueden modificar accidentalmente  
- **Trazabilidad**: Cada parte de trabajo está vinculado a un registro específico
- **Móvil-First**: Optimizado para técnicos en campo
- **Fotos Directas**: Captura inmediata sin necesidad de apps adicionales

## 🚨 Solución de Problemas

### Error: "Reparación no encontrada"
- Verifica que el Record ID sea correcto
- Asegúrate de que el registro existe en Airtable
- Confirma que las credenciales de Airtable sean válidas

### Los datos no se cargan
- Revisa las variables de entorno
- Verifica la conexión a internet
- Comprueba que la base de Airtable sea la correcta

### Error al subir archivos
- Verifica la configuración de UploadThing
- Asegúrate de que los archivos no excedan el tamaño máximo
- Confirma que el formato de archivo sea compatible
