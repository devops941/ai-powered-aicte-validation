/**
 * api.ts - Connects the React Frontend to the Python DocVerify Backend.
 */

import { InstitutionApplication } from './types';

const API_BASE = '/api';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchBackendApplications(): Promise<InstitutionApplication[]> {
  try {
    const res = await fetch(`${API_BASE}/applications`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Backend not reachable, using offline data:', err);
    return [];
  }
}

export async function runBackendValidation(
  payload: {
    application_no: string;
    institution_name: string;
    aicte_id: string;
    academic_year: string;
    test_bundle?: string;
    officer_name?: string;
    state?: string;
    region?: string;
  },
  filesMap?: Record<string, File>
): Promise<InstitutionApplication | null> {
  try {
    let res: Response;
    if (filesMap && Object.keys(filesMap).length > 0) {
      const formData = new FormData();
      formData.append('application_no', payload.application_no);
      formData.append('institution_name', payload.institution_name);
      formData.append('aicte_id', payload.aicte_id);
      formData.append('academic_year', payload.academic_year);
      if (payload.test_bundle) formData.append('test_bundle', payload.test_bundle);
      if (payload.officer_name) formData.append('officer_name', payload.officer_name);
      if (payload.state) formData.append('state', payload.state);
      if (payload.region) formData.append('region', payload.region);

      for (const [key, file] of Object.entries(filesMap)) {
        formData.append(key, file);
      }

      res = await fetch(`${API_BASE}/applications/validate`, {
        method: 'POST',
        body: formData,
      });
    } else {
      res = await fetch(`${API_BASE}/applications/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) throw new Error(`Validation failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error executing backend validation:', err);
    return null;
  }
}

export function getReportPdfUrl(applicationId: string): string {
  return `${API_BASE}/reports/${encodeURIComponent(applicationId)}/pdf`;
}

export async function loginBackend(
  username: string,
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Authentication failed' };
    }
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: 'Cannot connect to authentication service' };
  }
}

// --- AI GEMINI INTEGRATION ---

export async function getAiStatus(): Promise<{ configured: boolean; key_preview?: string; model?: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch {
    return { configured: false };
  }
}

export async function saveAiConfig(apiKey: string): Promise<{ status: string; configured: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/ai/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  return await res.json();
}

export interface AiDocVerification {
  document: string;
  verdict: string;
  details: string;
}

export async function generateAiSynthesis(applicationNo: string): Promise<{
  configured: boolean;
  text: string;
  document_verifications?: AiDocVerification[];
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/ai/synthesis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_no: applicationNo }),
  });
  return await res.json();
}

export async function askAiCopilot(applicationNo: string, question: string): Promise<{ answer: string; error?: string }> {
  const res = await fetch(`${API_BASE}/ai/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_no: applicationNo, question }),
  });
  return await res.json();
}

export async function markApplicationReviewed(
  applicationNo: string,
  reviewedBy: string,
  officerComments: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/applications/${encodeURIComponent(applicationNo)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed_by: reviewedBy, officer_comments: officerComments }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function purgeBackendDatabase(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/applications/purge`, { method: 'POST' });
  return await res.json();
}
