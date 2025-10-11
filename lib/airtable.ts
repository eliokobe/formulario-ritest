// Generic interface for Airtable responses
interface AirtableResponse {
  records: any[];
}

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_REPARACIONES = process.env.AIRTABLE_TABLE_REPARACIONES;
const AIRTABLE_TABLE_FORMULARIO = process.env.AIRTABLE_TABLE_FORMULARIO;

// Ensure table names with spaces/accents are URL-safe
const getBaseUrl = (tableName: string) => `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

async function makeRequest(url: string, options: RequestInit = {}) {
  const headers = {
    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 429) {
        // Rate limiting - wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
        continue;
      }
      
      if (!response.ok) {
        let details = '';
        try {
          const text = await response.text();
          details = text.length < 500 ? ` - ${text}` : '';
        } catch {}
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}${details}`);
      }
      
      return response;
    } catch (error) {
      if (retries === 1) throw error;
      retries--;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Función eliminada - ya no se usa el sistema de bookings

// Función eliminada - ya no se usa el sistema de bookings

// Generic functions for any table
export async function createRecord(tableName: string, fields: Record<string, any>): Promise<{ id: string }> {
  const payload = { fields };

  try {
    const response = await makeRequest(getBaseUrl(tableName), {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response) {
      throw new Error('No response received from Airtable');
    }
    
    const data: any = await response.json();
    
    if (!data.id) {
      throw new Error('No ID returned from Airtable');
    }
    
    return { id: data.id };
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw new Error(`Failed to create record in ${tableName}`);
  }
}

export async function listRecords(tableName: string, params?: Record<string, string>): Promise<any[]> {
  let url = getBaseUrl(tableName);
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await makeRequest(url);
    if (!response) {
      throw new Error('No response received from Airtable');
    }
    const data: AirtableResponse = await response.json();
    return data.records;
  } catch (error) {
    console.error(`Error listing records from ${tableName}:`, error);
    throw new Error(`Failed to list records from ${tableName}`);
  }
}

export async function updateRecord(tableName: string, id: string, fields: Record<string, any>): Promise<{ id: string }> {
  const payload = { fields };

  try {
    const response = await makeRequest(`${getBaseUrl(tableName)}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!response) {
      throw new Error('No response received from Airtable');
    }
    
    const data: any = await response.json();
    return { id: data.id };
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    throw new Error(`Failed to update record in ${tableName}`);
  }
}

// Función eliminada - ya no se usa la tabla de clientes

// Specific function for creating repairs
export async function createRepair(repairData: any): Promise<{ id: string }> {
  return createRecord(AIRTABLE_TABLE_REPARACIONES!, repairData);
}

// Specific functions for Formulario table
export async function findFormularioByExpediente(expediente: string): Promise<any[]> {
  return listRecords(AIRTABLE_TABLE_FORMULARIO!, {
    filterByFormula: `{Expediente} = '${expediente}'`,
    maxRecords: '1',
  });
}

export async function updateFormulario(recordId: string, data: any): Promise<{ id: string }> {
  return updateRecord(AIRTABLE_TABLE_FORMULARIO!, recordId, data);
}

export async function createFormulario(data: any): Promise<{ id: string }> {
  return createRecord(AIRTABLE_TABLE_FORMULARIO!, data);
}

// File upload utilities for base64 conversion
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

// Convert base64 to Airtable attachment format
export function createAirtableAttachment(base64: string, filename: string) {
  return {
    url: base64,
    filename: filename,
  };
}

// Helper function to process multiple files for Airtable
export async function processFilesForAirtable(files: FileList | File[]): Promise<any[]> {
  const attachments = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i] instanceof File ? files[i] : (files as FileList)[i];
    try {
      const base64 = await convertFileToBase64(file);
      attachments.push(createAirtableAttachment(base64, file.name));
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`Failed to process file: ${file.name}`);
    }
  }
  
  return attachments;
}