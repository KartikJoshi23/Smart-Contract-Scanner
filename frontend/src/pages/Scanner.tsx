import { useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { analyzeContract, fetchContract, exportJSON, exportPDF, type Network } from '@/services/api';
import { useScanner } from '@/context/ScannerContext';
import { useChat } from '@/context/ChatContext';
import Loading from '@/components/Loading';
import SeverityBadge from '@/components/SeverityBadge';
import VulnerabilityCard from '@/components/VulnerabilityCard';
import RiskGauge from '@/components/RiskGauge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { toast } from '@/hooks/useToast';
import {
  Play,
  FileCode,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  RotateCcw,
  Search,
  Download,
  Globe,
  FileJson,
  FileDown
} from 'lucide-react';

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No funds");
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`;

const networks: { value: Network; label: string; icon: string }[] = [
  { value: 'ethereum', label: 'Ethereum', icon: '◆' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'bsc', label: 'BSC', icon: '◈' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '◇' },
  { value: 'optimism', label: 'Optimism', icon: '○' },
  { value: 'base', label: 'Base', icon: '□' },
];

const Scanner = () => {
  const {
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
  } = useScanner();

  const [inputMode, setInputMode] = useState<'code' | 'address'>('code');
  const [contractAddress, setContractAddress] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { setIsChatOpen, setChatQuestion } = useChat();
  const formRef = useRef<HTMLFormElement>(null);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onAnalyze: useCallback(() => {
      formRef.current?.requestSubmit();
    }, []),
    onToggleChat: useCallback(() => {
      setIsChatOpen((prev: boolean) => !prev);
    }, [setIsChatOpen]),
    onClosePanel: useCallback(() => {
      setIsChatOpen(false);
    }, [setIsChatOpen]),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractCode.trim()) {
      setError('Please enter contract code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeContract({
        contract_name: contractName || 'Unnamed Contract',
        contract_code: contractCode,
        network: network,
      });
      setResult(analysis);
      toast({
        title: 'Analysis Complete',
        description: `Found ${analysis.vulnerabilities.length} vulnerabilities (Risk: ${analysis.risk_score})`,
        variant: analysis.vulnerabilities.length > 0 ? 'info' : 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(msg);
      toast({ title: 'Analysis Failed', description: msg, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchContract = async () => {
    if (!contractAddress.trim()) {
      setFetchError('Please enter a contract address');
      return;
    }

    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      setFetchError('Invalid address format. Must be 42 characters starting with 0x');
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      const result = await fetchContract({
        address: contractAddress,
        network: network,
      });

      if (result.is_verified && result.source_code) {
        setContractName(result.contract_name);
        setContractCode(result.source_code);
        setInputMode('code');
        setFetchError(null);
      } else {
        setFetchError('Contract source code is not verified on this network');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFetchError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setFetchError(axiosErr.response?.data?.detail || 'Failed to fetch contract');
      } else {
        setFetchError('Failed to fetch contract. Please check the address and network.');
      }
    } finally {
      setIsFetching(false);
    }
  };

  const loadSample = () => {
    setContractName('VulnerableBank');
    setContractCode(SAMPLE_CONTRACT);
    setError(null);
  };

  const handleClear = () => {
    clearAll();
    setContractAddress('');
    setFetchError(null);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  };

  // getRiskColor no longer needed — RiskGauge handles this visually

  const getRiskBg = (score: number) => {
    if (score >= 70) return 'from-red-500/20 to-red-500/5';
    if (score >= 40) return 'from-amber-500/20 to-amber-500/5';
    return 'from-emerald-500/20 to-emerald-500/5';
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Security Analysis
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Secure Your</span>{' '}
            <span className="text-gradient">Smart Contracts</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Detect vulnerabilities, understand risks, and get AI-generated fixes for your Solidity code
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">

          {/* Left Panel - Code Input */}
          <div className="flex flex-col">
            <Card className="glass-card gradient-border overflow-hidden flex-1 flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Card Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <FileCode className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Contract Code</h2>
                      <p className="text-xs text-muted-foreground">Paste code or fetch from blockchain</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(contractCode || result) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        className="gap-2 border-white/10 hover:border-white/20 hover:bg-white/5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'code' | 'address')} className="w-full">
                  <div className="px-5 pt-4">
                    <TabsList className="grid w-full grid-cols-2 bg-background/50">
                      <TabsTrigger value="code" className="gap-2 data-[state=active]:bg-blue-500/20">
                        <FileCode className="w-4 h-4" />
                        Paste Code
                      </TabsTrigger>
                      <TabsTrigger value="address" className="gap-2 data-[state=active]:bg-blue-500/20">
                        <Globe className="w-4 h-4" />
                        Fetch by Address
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Paste Code Tab */}
                  <TabsContent value="code" className="mt-0">
                    <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-5">
                      {/* Name & Network Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Contract Name</label>
                          <Input
                            value={contractName}
                            onChange={(e) => setContractName(e.target.value)}
                            placeholder="e.g., MyToken"
                            className="bg-background/50 border-white/10 focus:border-blue-500/50 h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Network</label>
                          <Select value={network} onValueChange={(val) => setNetwork(val as Network)}>
                            <SelectTrigger className="bg-background/50 border-white/10 focus:border-blue-500/50 h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10">
                              {networks.map((n) => (
                                <SelectItem key={n.value} value={n.value}>
                                  <span className="flex items-center gap-2">
                                    <span className="text-blue-400">{n.icon}</span>
                                    {n.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Load Sample Button */}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadSample}
                          className="gap-2 border-white/10 hover:border-white/20 hover:bg-white/5"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          Load Sample
                        </Button>
                      </div>

                      {/* Code Editor */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Solidity Code</label>
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e]">
                          <Editor
                            height="320px"
                            defaultLanguage="sol"
                            value={contractCode}
                            onChange={(value) => setContractCode(value || '')}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              fontFamily: "'JetBrains Mono', monospace",
                              padding: { top: 16, bottom: 16 },
                              scrollBeyondLastLine: false,
                              lineNumbers: 'on',
                              renderLineHighlight: 'line',
                              cursorBlinking: 'smooth',
                              smoothScrolling: true,
                              lineHeight: 1.6,
                            }}
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-500/25 border-0"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Analyzing Contract...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Analyze Contract
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Fetch by Address Tab */}
                  <TabsContent value="address" className="mt-0">
                    <div className="p-5 space-y-5">
                      {/* Network Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Network</label>
                        <Select value={network} onValueChange={(val) => setNetwork(val as Network)}>
                          <SelectTrigger className="bg-background/50 border-white/10 focus:border-blue-500/50 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            {networks.map((n) => (
                              <SelectItem key={n.value} value={n.value}>
                                <span className="flex items-center gap-2">
                                  <span className="text-blue-400">{n.icon}</span>
                                  {n.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Contract Address Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Contract Address</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            placeholder="0x..."
                            className="bg-background/50 border-white/10 focus:border-blue-500/50 h-12 pl-11 font-mono"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the contract address to fetch verified source code from the blockchain
                        </p>
                      </div>

                      {/* Fetch Error */}
                      {fetchError && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400 font-medium">Failed to Fetch</p>
                            <p className="text-red-400/70 text-sm mt-1">{fetchError}</p>
                          </div>
                        </div>
                      )}

                      {/* Fetch Button */}
                      <Button
                        type="button"
                        onClick={handleFetchContract}
                        disabled={isFetching}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border-0"
                      >
                        {isFetching ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Fetching Contract...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5 mr-2" />
                            Fetch Contract Code
                          </>
                        )}
                      </Button>

                      {/* Info Box */}
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <h4 className="text-sm font-medium text-blue-400 mb-2">How it works</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Enter a verified contract address from the selected network</li>
                          <li>• We'll fetch the source code automatically</li>
                          <li>• The code will be loaded for analysis</li>
                          <li>• Only verified contracts are supported</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="flex flex-col">
            <Card className="glass-card gradient-border overflow-hidden flex-1 flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Card Header */}
                <div className="flex items-center gap-3 p-5 border-b border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
                    <p className="text-xs text-muted-foreground">Vulnerabilities and recommendations</p>
                  </div>
                </div>

                <div className="p-5 flex-1">
                  {/* Error State */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-5">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Analysis Failed</p>
                        <p className="text-red-400/70 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && <Loading />}

                  {/* Results */}
                  {result && !isLoading && (
                    <div className="space-y-6">
                      {/* Risk Score Card */}
                      <div className={`relative p-5 rounded-xl bg-gradient-to-br ${getRiskBg(result.risk_score ?? 0)} border border-white/5 overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Contract</p>
                            <h3 className="text-xl font-bold text-white">{result.contract_name}</h3>
                          </div>
                          {result.overall_risk && <SeverityBadge severity={result.overall_risk} size="lg" />}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="stat-card flex items-center justify-center">
                            <RiskGauge score={result.risk_score ?? 0} size={80} />
                          </div>
                          <div className="stat-card text-center">
                            <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                            <div className="text-2xl font-bold text-white">{result.vulnerabilities.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Issues</div>
                          </div>
                          <div className="stat-card text-center">
                            <Layers className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                            <div className="text-2xl font-bold text-white">{result.total_lines ?? 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Lines</div>
                          </div>
                          <div className="stat-card text-center">
                            <Clock className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                            <div className="text-2xl font-bold text-white">
                              {result.scan_duration_ms ? formatDuration(result.scan_duration_ms) : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Time</div>
                          </div>
                        </div>

                        {/* Summary */}
                        {result.summary && (
                          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{result.summary}</p>
                        )}

                        {/* Export Buttons */}
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
                            onClick={() => exportJSON(result.id)}
                          >
                            <FileJson className="w-4 h-4" />
                            Export JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10 text-violet-400"
                            onClick={() => exportPDF(result.id)}
                          >
                            <FileDown className="w-4 h-4" />
                            Export PDF
                          </Button>
                        </div>
                      </div>

                      {/* Vulnerabilities List */}
                      {result.vulnerabilities.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <h3 className="text-lg font-semibold text-white">
                              Vulnerabilities ({result.vulnerabilities.length})
                            </h3>
                          </div>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {result.vulnerabilities.map((vuln, index) => (
                              <VulnerabilityCard
                                key={vuln.id}
                                vulnerability={vuln}
                                index={index}
                                onAskAI={(question) => {
                                  setChatQuestion(question);
                                  setIsChatOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-emerald-400 mb-2">All Clear!</h3>
                          <p className="text-muted-foreground">No vulnerabilities detected in this contract.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!result && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6 border border-white/5">
                        <Shield className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-xl font-semibold text-muted-foreground mb-2">Ready to Analyze</h3>
                      <p className="text-muted-foreground/70 text-sm max-w-xs">
                        Paste your Solidity code or fetch a contract by address to detect vulnerabilities
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Scanner;