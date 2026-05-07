import { createContext, useContext, useState, ReactNode } from 'react';
import { type AnalysisResult, type Network } from '@/services/api';

interface ScannerState {
  contractName: string;
  setContractName: (name: string) => void;
  contractCode: string;
  setContractCode: (code: string) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

const ScannerContext = createContext<ScannerState | undefined>(undefined);

export const ScannerProvider = ({ children }: { children: ReactNode }) => {
  const [contractName, setContractName] = useState('');
  const [contractCode, setContractCode] = useState('');
  const [network, setNetwork] = useState<Network>('ethereum');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearAll = () => {
    setContractName('');
    setContractCode('');
    setNetwork('ethereum');
    setResult(null);
    setError(null);
  };

  return (
    <ScannerContext.Provider
      value={{
        contractName,
        setContractName,
        contractCode,
        setContractCode,
        network,
        setNetwork,
        isLoading,
        setIsLoading,
        result,
        setResult,
        error,
        setError,
        clearAll,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};