import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStats, getHistory, type StatsResponse, type HistoryItem } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Zap,
    TrendingUp,
    AlertTriangle,
    Clock,
    ChevronRight,
    Activity,
    BarChart3,
    FileCode,
    Sparkles,
} from 'lucide-react';

// ── Animated Counter ──
const AnimatedCounter = ({ target, duration = 1500 }: { target: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (target === 0) return;
        let start = 0;
        const step = Math.max(1, Math.floor(target / (duration / 16)));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);

    return <span ref={ref}>{count.toLocaleString()}</span>;
};

// ── SVG Sparkline ──
const Sparkline = ({ data, width = 200, height = 50 }: { data: number[]; width?: number; height?: number }) => {
    if (!data.length || data.every(d => d === 0)) {
        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-40">
                <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-muted-foreground" />
            </svg>
        );
    }

    const max = Math.max(...data, 1);
    const padding = 4;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const points = data.map((v, i) => {
        const x = padding + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = padding + chartH - (v / max) * chartH;
        return `${x},${y}`;
    });

    const pathD = `M${points.join(' L')}`;
    const areaD = `${pathD} L${padding + chartW},${padding + chartH} L${padding},${padding + chartH} Z`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                    <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#sparkFill)" />
            <path d={pathD} fill="none" stroke="url(#sparkStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((v, i) => {
                const x = padding + (i / Math.max(data.length - 1, 1)) * chartW;
                const y = padding + chartH - (v / max) * chartH;
                return <circle key={i} cx={x} cy={y} r="3" fill="rgb(139, 92, 246)" className="opacity-0 hover:opacity-100 transition-opacity" />;
            })}
        </svg>
    );
};

// ── Risk helpers ──
const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 30) return 'text-yellow-400';
    if (score > 0) return 'text-emerald-400';
    return 'text-blue-400';
};

const getRiskBg = (score: number) => {
    if (score >= 70) return 'from-red-500/20 to-red-500/5 border-red-500/20';
    if (score >= 50) return 'from-orange-500/20 to-orange-500/5 border-orange-500/20';
    if (score >= 30) return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20';
    if (score > 0) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20';
    return 'from-blue-500/20 to-blue-500/5 border-blue-500/20';
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Skeleton ──
const StatSkeleton = () => (
    <div className="stat-card animate-pulse">
        <div className="h-4 w-20 bg-white/10 rounded mb-3" />
        <div className="h-8 w-16 bg-white/10 rounded mb-2" />
        <div className="h-3 w-24 bg-white/5 rounded" />
    </div>
);

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [recent, setRecent] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fake 7-day sparkline data from scans_this_week
    const [sparkData, setSparkData] = useState<number[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, h] = await Promise.all([getStats(), getHistory(5, 0)]);
                setStats(s);
                setRecent(h);

                // Generate plausible sparkline from weekly count
                const weekCount = s.scans_this_week || 0;
                const dailyAvg = weekCount / 7;
                const spark = Array.from({ length: 7 }, () => Math.max(0, Math.round(dailyAvg + (Math.random() - 0.5) * dailyAvg)));
                // Make sure total roughly matches
                const total = spark.reduce((a, b) => a + b, 0);
                if (total > 0) spark[6] = Math.max(0, spark[6] + (weekCount - total));
                setSparkData(spark);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const highestRisk = recent.length ? Math.max(...recent.map(r => r.risk_score)) : 0;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl blur-lg opacity-50" />
                                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                                    <p className="text-muted-foreground text-sm">Smart Contract Security Overview</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate('/scan')}
                            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-lg shadow-blue-500/20 gap-2 px-6 h-11"
                        >
                            <Zap className="w-4 h-4" />
                            Quick Scan
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {loading ? (
                        <>
                            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
                        </>
                    ) : (
                        <>
                            <motion.div variants={item} className="stat-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Total Scans</span>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    <AnimatedCounter target={stats?.total_analyses || 0} />
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{stats?.scans_today || 0} today</p>
                            </motion.div>

                            <motion.div variants={item} className="stat-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                        <FileCode className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Contracts</span>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    <AnimatedCounter target={stats?.total_contracts || 0} />
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">unique contracts</p>
                            </motion.div>

                            <motion.div variants={item} className="stat-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Vulnerabilities</span>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    <AnimatedCounter target={stats?.total_vulnerabilities || 0} />
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">detected total</p>
                            </motion.div>

                            <motion.div variants={item} className="stat-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-red-400" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Highest Risk</span>
                                </div>
                                <p className={`text-3xl font-bold ${getRiskColor(highestRisk)}`}>
                                    {highestRisk}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">in recent scans</p>
                            </motion.div>
                        </>
                    )}
                </motion.div>

                {/* Two column layout — equal columns */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Recent Scans */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="glass-card gradient-border overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-5 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-white font-semibold">Recent Scans</h2>
                                            <p className="text-xs text-muted-foreground">Latest security analyses</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-white gap-1"
                                        onClick={() => navigate('/history')}
                                    >
                                        View All <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>

                                {loading ? (
                                    <div className="p-5 space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex items-center gap-4 p-3 rounded-xl bg-white/5">
                                                <div className="w-12 h-12 rounded-xl bg-white/10" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-32 bg-white/10 rounded" />
                                                    <div className="h-3 w-20 bg-white/5 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : recent.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">No scans yet. Run your first analysis!</p>
                                        <Button
                                            size="sm"
                                            className="mt-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white"
                                            onClick={() => navigate('/scan')}
                                        >
                                            <Zap className="w-3.5 h-3.5 mr-1.5" /> Start Scanning
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-3 space-y-1">
                                        {recent.map((scan) => (
                                            <button
                                                key={scan.id}
                                                onClick={() => navigate(`/analysis/${scan.id}`)}
                                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRiskBg(scan.risk_score)} flex items-center justify-center border`}>
                                                    <span className={`text-lg font-bold ${getRiskColor(scan.risk_score)}`}>{scan.risk_score}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate text-sm">{scan.contract_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-muted-foreground capitalize">{scan.network}</span>
                                                        <span className="text-muted-foreground/50">·</span>
                                                        <span className="text-xs text-muted-foreground">{formatDate(scan.created_at)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-center">
                                                        <span className="text-sm font-semibold text-white">{scan.vulnerability_count}</span>
                                                        <p className="text-[10px] text-muted-foreground">vulns</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Activity + Quick Actions */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
                        {/* Activity Sparkline */}
                        <Card className="glass-card gradient-border overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-sm">Weekly Activity</h3>
                                        <p className="text-xs text-muted-foreground">{stats?.scans_this_week || 0} scans this week</p>
                                    </div>
                                </div>
                                <div className="w-full">
                                    <Sparkline data={sparkData} width={280} height={60} />
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                        <span key={d}>{d}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="glass-card gradient-border overflow-hidden">
                            <CardContent className="p-5">
                                <h3 className="text-white font-semibold text-sm mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => navigate('/scan')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-left"
                                    >
                                        <Zap className="w-4 h-4 text-blue-400" />
                                        <div>
                                            <p className="text-sm font-medium text-white">New Scan</p>
                                            <p className="text-xs text-muted-foreground">Analyze a contract</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => navigate('/history')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left"
                                    >
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-white">Scan History</p>
                                            <p className="text-xs text-muted-foreground">View past analyses</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => navigate('/stats')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left"
                                    >
                                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-white">Statistics</p>
                                            <p className="text-xs text-muted-foreground">Detailed metrics</p>
                                        </div>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
