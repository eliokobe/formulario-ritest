interface BookingRecord {
  id?: string;
  fields: {
    Nombre: string;
    Email: string;
    Fecha: string;
  };
}

interface AirtableResponse {
  records: BookingRecord[];
}

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_TABLE_CLIENTES = process.env.AIRTABLE_TABLE_CLIENTES;

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

export async function findByDateTime(dateIso: string): Promise<BookingRecord | null> {
  // Compare by minute to avoid millisecond mismatches and ensure proper datetime comparison
  const filterFormula = `IS_SAME({Fecha}, "${dateIso}", 'minute')`;
  const url = `${getBaseUrl(AIRTABLE_TABLE_NAME!)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  console.log('🔍 Checking availability for:', dateIso);
  console.log('🔍 Filter formula:', filterFormula);
  console.log('🔍 Request URL:', url);
  
  try {
    const response = await makeRequest(url);
    if (!response) {
      throw new Error('No response received from Airtable');
    }
    const data: AirtableResponse = await response.json();
    
    console.log('🔍 Airtable response:', JSON.stringify(data, null, 2));
    
    return data.records.length > 0 ? data.records[0] : null;
  } catch (error) {
    console.error('Error finding booking by date time:', error);
    throw new Error('Failed to check availability');
  }
}

export async function createBooking({ 
  name, 
  email, 
  date_time 
}: { 
  name: string; 
  email: string; 
  date_time: string; 
}): Promise<{ id: string }> {
  const payload = {
    fields: {
      Nombre: name,
      Email: email,
      Fecha: date_time,
    },
  };

  try {
    const response = await makeRequest(getBaseUrl(AIRTABLE_TABLE_NAME!), {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response) {
      throw new Error('No response received from Airtable');
    }
    
    const data: BookingRecord = await response.json();
    
    if (!data.id) {
      throw new Error('No ID returned from Airtable');
    }
    
    return { id: data.id };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
}

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

// Specific function for creating clients
export async function createClient(clientData: any): Promise<{ id: string }> {
  return createRecord(AIRTABLE_TABLE_CLIENTES!, clientData);
}

// Specific function for creating repairs
export async function createRepair(repairData: any): Promise<{ id: string }> {
  return createRecord(AIRTABLE_TABLE_NAME!, repairData);
}