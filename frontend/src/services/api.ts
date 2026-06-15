import axios from 'axios';

// VITE_API_URL should point to the backend's /api prefix.
// Local dev: not set (uses Vite proxy to /api → localhost:8001)
// Production: e.g. "https://your-app.onrender.com/api"
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Network = 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'optimism' | 'base';

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  impact?: string;
  recommendation?: string;
  vulnerable_code?: string;
  fixed_code?: string;
  line_start?: number;
  line_end?: number;
  function_name?: string;
  confidence?: string;
}

export interface AnalysisResult {
  id: string;
  contract_name: string;
  network: string;
  risk_score: number;
  overall_risk: Severity;
  summary: string;
  vulnerabilities: Vulnerability[];
  scan_duration_ms: number;
  total_lines: number;
  created_at: string;
}

export interface ContractAnalysisRequest {
  contract_name: string;
  contract_code: string;
  network: Network;
}

export interface FetchContractRequest {
  address: string;
  network: Network;
}

export interface FetchContractResponse {
  address: string;
  network: string;
  contract_name: string;
  source_code: string;
  compiler_version?: string;
  is_verified: boolean;
}

export interface HealthResponse {
  status: string;
  version: string;
  services: {
    database: string;
    ai: string;
  };
}

export interface StatsResponse {
  total_contracts: number;
  total_analyses: number;
  total_vulnerabilities: number;
  scans_today: number;
  scans_this_week: number;
  average_scan_time_ms: number;
}

export interface HistoryItem {
  id: string;
  contract_name: string;
  network: string;
  risk_score: number;
  vulnerability_count: number;
  created_at: string;
}

// Full analysis detail (includes source code)
export interface AnalysisDetailResponse extends AnalysisResult {
  source_code: string;
}

// Get a single analysis by ID
export const getAnalysisById = async (id: string): Promise<AnalysisDetailResponse> => {
  const response = await api.get<AnalysisDetailResponse>(`/history/${id}`);
  return response.data;
};

// Analyze contract code
export const analyzeContract = async (request: ContractAnalysisRequest): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>('/analyze', request);
  return response.data;
};

// Fetch contract from blockchain by address
export const fetchContract = async (request: FetchContractRequest): Promise<FetchContractResponse> => {
  const response = await api.post<FetchContractResponse>('/fetch-contract', request);
  return response.data;
};

// Get contract info
export const getContractInfo = async (network: string, address: string): Promise<any> => {
  const response = await api.get(`/contract-info/${network}/${address}`);
  return response.data;
};

// Get health status
export const getHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
};

// Get statistics
export const getStats = async (): Promise<StatsResponse> => {
  const response = await api.get<StatsResponse>('/stats');
  return response.data;
};

// Get analysis history
export const getHistory = async (limit: number = 20, offset: number = 0): Promise<HistoryItem[]> => {
  const response = await api.get<HistoryItem[]>('/history', {
    params: { limit, offset }
  });
  return response.data;
};

// Export analysis as JSON (downloads file)
export const exportJSON = async (analysisId: string): Promise<void> => {
  const response = await api.get(`/reports/${analysisId}/json`);
  const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${analysisId}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export analysis as PDF (downloads file)
export const exportPDF = async (analysisId: string): Promise<void> => {
  const response = await api.get(`/reports/${analysisId}/pdf`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${analysisId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Chat Types & API ──

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface ChatHistoryResponse {
  session_id: number;
  analysis_id: number | null;
  messages: ChatMessage[];
  created_at: string;
}

// Send a chat message and get SSE stream
export const sendChatMessage = async (
  message: string,
  analysisId?: number,
  sessionId?: number,
  onChunk?: (text: string) => void,
  onDone?: (sessionId: number) => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        analysis_id: analysisId ?? null,
        session_id: sessionId ?? null,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Chat request failed' }));
      onError?.(err.detail || 'Chat request failed');
      return;
    }

    const newSessionId = parseInt(response.headers.get('X-Session-Id') || '0');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError?.('No response stream');
      return;
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              onChunk?.(data.content);
            } else if (data.type === 'done') {
              onDone?.(newSessionId);
            } else if (data.type === 'error') {
              onError?.(data.content);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    }

    // If we exit without a done signal, still notify
    onDone?.(newSessionId);
  } catch (err) {
    onError?.(err instanceof Error ? err.message : 'Chat failed');
  }
};

// Get chat history for a specific analysis
export const getChatHistory = async (analysisId: number): Promise<ChatHistoryResponse[]> => {
  const response = await api.get<ChatHistoryResponse[]>(`/chat/history/${analysisId}`);
  return response.data;
};

export default api;