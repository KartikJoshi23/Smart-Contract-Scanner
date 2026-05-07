/**
 * Shared type definitions for the Smart Contract Scanner frontend.
 *
 * NOTE: The canonical types used throughout the app are defined in
 * `@/services/api.ts` alongside the API functions. This file re-exports
 * them for convenience and adds any supplementary types.
 */

export type {
  Severity,
  Network,
  Vulnerability,
  AnalysisResult,
  ContractAnalysisRequest,
  FetchContractRequest,
  FetchContractResponse,
  HealthResponse,
  StatsResponse,
  HistoryItem,
} from '@/services/api';