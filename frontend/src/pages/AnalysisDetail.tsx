import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DiffEditor } from '@monaco-editor/react';
import { getAnalysisById, type AnalysisDetailResponse, type Vulnerability } from '@/services/api';
import VulnerabilityCard from '@/components/VulnerabilityCard';
import { useChat } from '@/context/ChatContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Clock,
    Copy,
    Check,
    FileCode,
    Shield,
    AlertTriangle,
    MessageCircle,
    FileJson,
    FileDown,
} from 'lucide-react';
import { exportJSON, exportPDF } from '@/services/api';

// ── Donut Chart ──
const SeverityDonut = ({ vulnerabilities }: { vulnerabilities: Vulnerability[] }) => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    vulnerabilities.forEach(v => {
        const s = (v.severity || 'info').toLowerCase();
        if (s in counts) counts[s]++;
        else counts['info']++;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const colors: Record<string, string> = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#22c55e',
        info: '#3b82f6',
    };

    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const segments = Object.entries(counts)
        .filter(([, c]) => c > 0)
        .map(([sev, c]) => {
            const pct = c / total;
            const dashLen = pct * circumference;
            const seg = { sev, count: c, color: colors[sev], dashLen, dashOffset: -offset };
            offset += dashLen;
            return seg;
        });

    return (
        <div className="flex items-center gap-6">
            <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                {segments.map(seg => (
                    <circle
                        key={seg.sev}
                        cx="55"
                        cy="55"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={`${seg.dashLen} ${circumference - seg.dashLen}`}
                        strokeDashoffset={seg.dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 55 55)"
                        className="transition-all duration-700"
                    />
                ))}
                <text x="55" y="52" textAnchor="middle" className="fill-white text-lg font-bold" fontSize="20">{total}</text>
                <text x="55" y="68" textAnchor="middle" className="fill-muted-foreground" fontSize="10">issues</text>
            </svg>

            <div className="space-y-1.5">
                {segments.map(seg => (
                    <div key={seg.sev} className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                        <span className="text-muted-foreground capitalize">{seg.sev}</span>
                        <span className="text-white font-semibold ml-auto">{seg.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Risk gauge color helpers ──
const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 30) return 'text-yellow-400';
    if (score > 0) return 'text-emerald-400';
    return 'text-blue-400';
};

const getRiskLabel = (score: number) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Medium';
    if (score > 0) return 'Low';
    return 'Safe';
};

const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const AnalysisDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState<AnalysisDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { setIsChatOpen, setChatQuestion } = useChat();
    const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                setLoading(true);
                const data = await getAnalysisById(id);
                setAnalysis(data);
            } catch {
                setError('Failed to load analysis');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const copyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const handleAskAI = useCallback((question: string) => {
        setChatQuestion(question);
        setIsChatOpen(true);
    }, [setChatQuestion, setIsChatOpen]);

    // Build diff content
    const originalCode = analysis?.source_code || '';
    const fixedCode = selectedVuln?.fixed_code
        ? `// Fix for: ${selectedVuln.title}\n${selectedVuln.fixed_code}`
        : analysis?.vulnerabilities?.[0]?.fixed_code
            ? `// Suggested fix for: ${analysis.vulnerabilities[0].title}\n${analysis.vulnerabilities[0].fixed_code}`
            : originalCode;

    // ── Loading state ──
    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-48 bg-white/10 rounded" />
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 h-96 bg-white/5 rounded-xl" />
                            <div className="h-96 bg-white/5 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error state ──
    if (error || !analysis) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Analysis Not Found</h2>
                    <p className="text-muted-foreground mb-6">{error || 'This analysis does not exist.'}</p>
                    <Button onClick={() => navigate('/history')} variant="outline" className="border-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl blur-lg opacity-40" />
                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                                    <FileCode className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{analysis.contract_name}</h1>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="bg-white/5 border-white/10 text-xs capitalize">{analysis.network}</Badge>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(analysis.created_at)}</span>
                                    <span>{analysis.total_lines} lines</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={copyLink} className="border-white/10 gap-1.5 text-muted-foreground hover:text-white">
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied!' : 'Share'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => exportJSON(analysis.id)} className="border-white/10 gap-1.5 text-muted-foreground hover:text-white">
                                <FileJson className="w-3.5 h-3.5" /> JSON
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => exportPDF(analysis.id)} className="border-white/10 gap-1.5 text-muted-foreground hover:text-white">
                                <FileDown className="w-3.5 h-3.5" /> PDF
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => { setChatQuestion(undefined); setIsChatOpen(true); }}
                                className="bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 gap-1.5"
                            >
                                <MessageCircle className="w-3.5 h-3.5" /> Ask AI
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Risk Score Banner */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="glass-card gradient-border overflow-hidden mb-6">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                {/* Score */}
                                <div className="flex items-center gap-6">
                                    <div className="relative w-24 h-24">
                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                            <circle
                                                cx="50" cy="50" r="42"
                                                fill="none"
                                                stroke={analysis.risk_score >= 70 ? '#ef4444' : analysis.risk_score >= 50 ? '#f97316' : analysis.risk_score >= 30 ? '#eab308' : analysis.risk_score > 0 ? '#22c55e' : '#3b82f6'}
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(analysis.risk_score / 100) * 264} 264`}
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-2xl font-bold ${getRiskColor(analysis.risk_score)}`}>{analysis.risk_score}</span>
                                            <span className="text-[10px] text-muted-foreground">/ 100</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-lg font-bold ${getRiskColor(analysis.risk_score)}`}>{getRiskLabel(analysis.risk_score)} Risk</p>
                                        <p className="text-sm text-muted-foreground max-w-sm">{analysis.summary}</p>
                                    </div>
                                </div>

                                {/* Separator */}
                                <div className="hidden md:block w-px h-20 bg-white/10" />

                                {/* Donut */}
                                <SeverityDonut vulnerabilities={analysis.vulnerabilities} />

                                {/* Quick stats */}
                                <div className="flex gap-6 ml-auto">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{analysis.vulnerabilities.length}</p>
                                        <p className="text-xs text-muted-foreground">Issues</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{((analysis.scan_duration_ms || 0) / 1000).toFixed(1)}s</p>
                                        <p className="text-xs text-muted-foreground">Scan Time</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Main Content: Code Diff + Vulnerability List */}
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Code Diff */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
                        <Card className="glass-card gradient-border overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-4 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <FileCode className="w-4 h-4 text-blue-400" />
                                        <h3 className="text-white font-semibold text-sm">Code Diff</h3>
                                        {selectedVuln && (
                                            <Badge variant="outline" className="bg-violet-500/10 border-violet-500/20 text-violet-300 text-xs">
                                                {selectedVuln.title}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">Original ↔ Fixed</span>
                                </div>
                                <div className="h-[500px]">
                                    <DiffEditor
                                        original={originalCode}
                                        modified={fixedCode}
                                        language="sol"
                                        theme="vs-dark"
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            scrollBeyondLastLine: false,
                                            renderSideBySide: true,
                                            lineNumbers: 'on',
                                            padding: { top: 12 },
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Vulnerability List */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <h3 className="text-white font-semibold text-sm">Vulnerabilities ({analysis.vulnerabilities.length})</h3>
                        </div>

                        {analysis.vulnerabilities.length === 0 ? (
                            <Card className="glass-card gradient-border">
                                <CardContent className="p-8 text-center">
                                    <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-white font-medium">No vulnerabilities found</p>
                                    <p className="text-sm text-muted-foreground mt-1">This contract appears to be secure.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {analysis.vulnerabilities.map((vuln, idx) => (
                                    <div
                                        key={vuln.id}
                                        onClick={() => setSelectedVuln(vuln)}
                                        className={`cursor-pointer rounded-xl transition-all duration-200 ${selectedVuln?.id === vuln.id ? 'ring-2 ring-violet-500/50' : ''
                                            }`}
                                    >
                                        <VulnerabilityCard
                                            vulnerability={vuln}
                                            index={idx}
                                            onAskAI={handleAskAI}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

        </div>
    );
};

export default AnalysisDetail;
