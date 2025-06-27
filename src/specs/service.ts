const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

export type ProveData = {
  lat: number;
  lon: number;
  resolution: number;
  h3_map: string[];
}

export type VerifyProofData = {
  proof: string;
  public_inputs: string[];
}

export type VerifyResponse = {
  ok: boolean;
}

export type ErrorResponse = {
  error: string;
  status?: number;
}

export const getProveData = async (body: ProveData): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/prove`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    return {
      ...data,
      status: response.status,
      error: data.error || `HTTP ${response.status}: ${response.statusText}`
    };
  }
  
  return data;
}

export const getVerifyData = async (verifyProofData: VerifyProofData): Promise<VerifyResponse> => {
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    body: JSON.stringify(verifyProofData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
