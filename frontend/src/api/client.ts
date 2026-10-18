import axios, { AxiosError, AxiosProgressEvent } from 'axios';
import {
  AuditResponse,
  PatchesResponse,
  ApplyRequest,
  ApplyResponse,
  GitHubAuditRequest,
  HealthResponse,
} from '../types/api';

// Configurable API Base URL
// In development, Vite's proxy (in vite.config.ts) routes '/api' and '/health' to http://127.0.0.1:8000.
// When running in browser on a different port than 8000, we route through relative proxy endpoints
// to completely prevent CORS preflight OPTIONS requests (which FastAPI returns 405 for when CORS middleware is absent).
const envBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const isLocalBackend = envBaseUrl.includes('127.0.0.1:8000') || envBaseUrl.includes('localhost:8000');
const isRunningInBrowser = typeof window !== 'undefined';
const shouldUseProxy = isRunningInBrowser && isLocalBackend && window.location.port !== '8000';

export const API_BASE_URL = shouldUseProxy ? '' : envBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large repository scanning / LLM enrichment
  headers: {
    'Accept': 'application/json',
  },
});

// Response error handler to extract structured FastAPI error details
export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ detail?: string | Array<{ loc?: string[]; msg?: string }> }>;
    
    // Server responded with an error status
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data;
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
      }
      if (typeof data === 'string') {
        return data;
      }
    }

    if (axiosErr.response?.status === 404) {
      return 'The requested audit or resource was not found (404).';
    }
    if (axiosErr.response?.status === 413) {
      return 'The repository archive exceeds the maximum upload limit (configured at 20MB).';
    }
    if (axiosErr.response?.status === 502) {
      return 'Failed to fetch or clone the GitHub repository. Verify repository visibility, existence, or rate limits.';
    }
    if (axiosErr.response?.status === 500) {
      return 'Internal server error while analyzing repository. Check server console logs.';
    }

    if (axiosErr.code === 'ECONNABORTED') {
      return 'Request timed out while analyzing the repository. The codebase may be unusually large.';
    }
    if (axiosErr.message === 'Network Error') {
      return 'Unable to connect to backend at ' + (API_BASE_URL || 'http://127.0.0.1:8000') + '. Ensure the FastAPI server is running.';
    }

    return axiosErr.message || 'An unexpected error occurred during the request.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
}

export const auditsApi = {
  // Check backend connection health
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>('/health');
      return response.data;
    } catch (err) {
      // If direct request failed with Network Error and API_BASE_URL was set, attempt proxy fallback
      if (axios.isAxiosError(err) && err.message === 'Network Error' && API_BASE_URL) {
        const fallback = await axios.get<HealthResponse>('/health', { timeout: 3000 });
        return fallback.data;
      }
      throw err;
    }
  },

  // Upload repository ZIP file
  async uploadZip(file: File, onProgress?: (percent: number) => void): Promise<AuditResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<AuditResponse>('/api/v1/audits/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    });

    return response.data;
  },

  // Scan public GitHub repository
  async scanGitHub(repoUrl: string): Promise<AuditResponse> {
    const payload: GitHubAuditRequest = { repo_url: repoUrl };
    const response = await apiClient.post<AuditResponse>('/api/v1/audits/github', payload);
    return response.data;
  },

  // Fetch audit results and manifest
  async getAudit(auditId: string): Promise<AuditResponse> {
    const response = await apiClient.get<AuditResponse>(`/api/v1/audits/${encodeURIComponent(auditId)}`);
    return response.data;
  },

  // Fetch patch suggestions for review
  async getPatches(auditId: string): Promise<PatchesResponse> {
    const response = await apiClient.get<PatchesResponse>(`/api/v1/audits/${encodeURIComponent(auditId)}/patches`);
    return response.data;
  },

  // Explicitly approved application of review markers
  async applyPatches(auditId: string, findingIds: string[], approved: boolean): Promise<ApplyResponse> {
    const payload: ApplyRequest = {
      finding_ids: findingIds,
      approved,
    };
    const response = await apiClient.post<ApplyResponse>(
      `/api/v1/audits/${encodeURIComponent(auditId)}/apply`,
      payload
    );
    return response.data;
  },
};

