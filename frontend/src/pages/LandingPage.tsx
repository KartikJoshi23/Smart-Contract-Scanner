import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStats, type StatsResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Zap,
    Globe,
    FileText,
    ChevronRight,
    ArrowRight,
    Cpu,
    Lock,
    Eye,
    Layers,
    ChevronDown,
} from 'lucide-react';

// ── Animated Counter ──
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) => {
    const [count, setCount] = useState(0);

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

    return <>{count.toLocaleString()}{suffix}</>;
};

// ── Feature Card ──
const FeatureCard = ({ icon: Icon, title, description, gradient, delay }: {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
    delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="group relative"
    >
        <div className="relative h-full p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm
                    hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500
                    hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1">
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`} />

            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

// ── Tech Logo ──
const TechBadge = ({ name, delay }: { name: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay }}
        className="px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-muted-foreground
               hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all duration-300"
    >
        {name}
    </motion.div>
);

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const LandingPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<StatsResponse | null>(null);

    useEffect(() => {
        getStats().then(setStats).catch(() => { });
    }, []);

    return (
        <div className="relative overflow-hidden">
            {/* ═══════════ HERO ═══════════ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
                {/* Background effects */}
                <div className="absolute inset-0 -z-10">
                    {/* Primary gradient orb */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full
                          bg-gradient-to-br from-blue-600/20 via-violet-600/15 to-cyan-500/10 blur-[120px]" />
                    {/* Secondary orb */}
                    <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full
                          bg-gradient-to-tr from-violet-600/10 to-pink-500/5 blur-[100px]" />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                    {/* Floating particles */}
                    <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-blue-500/30 landing-float" />
                    <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-500/40 landing-float" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-[60%] left-[20%] w-1 h-1 rounded-full bg-cyan-500/30 landing-float" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-[45%] right-[25%] w-2.5 h-2.5 rounded-full bg-blue-400/20 landing-float" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-[70%] right-[10%] w-1.5 h-1.5 rounded-full bg-violet-400/25 landing-float" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-[80%] left-[40%] w-1 h-1 rounded-full bg-cyan-400/30 landing-float" style={{ animationDelay: '3s' }} />
                </div>

                {/* Content */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="text-center max-w-5xl mx-auto relative z-10"
                >
                    {/* Badge */}
                    <motion.div variants={item} className="mb-8">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium
                            hover:bg-blue-500/15 transition-colors cursor-default">
                            <Shield className="w-4 h-4" />
                            AI-Powered Smart Contract Security
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1 variants={item} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                        <span className="text-white">Protect Your</span>
                        <br />
                        <span className="text-gradient">Smart Contracts</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p variants={item} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Detect vulnerabilities in seconds with AI-powered analysis.
                        Scan Solidity code across 6 blockchain networks and get
                        instant fix recommendations.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button
                            onClick={() => navigate('/scan')}
                            className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-violet-600
                         hover:from-blue-500 hover:to-violet-500 shadow-2xl shadow-blue-500/25
                         border-0 gap-3 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-105"
                        >
                            <Zap className="w-5 h-5" />
                            Start Scanning
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="h-14 px-8 text-lg font-semibold border-white/10 hover:border-white/20
                         hover:bg-white/5 gap-2 transition-all duration-300"
                        >
                            View Dashboard
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div variants={item} className="flex items-center justify-center gap-8 text-sm text-muted-foreground/60">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Free & Secure</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>6 Networks</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            <span>Gemini AI</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
                        <ChevronDown className="w-5 h-5 animate-bounce" />
                    </div>
                </motion.div>
            </section>

            {/* ═══════════ FEATURES ═══════════ */}
            <section className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <span className="text-sm font-semibold text-blue-400 tracking-wider uppercase mb-4 block">Features</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Everything You Need to<br />
                            <span className="text-gradient">Secure Your Code</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Professional-grade smart contract analysis powered by cutting-edge AI technology
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Eye}
                            title="AI Vulnerability Detection"
                            description="Gemini 2.5 Flash analyzes your code for reentrancy, overflow, access control, and 20+ vulnerability types with detailed explanations."
                            gradient="from-blue-500/20 to-blue-600/10"
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Multi-Chain Support"
                            description="Fetch verified contracts from Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base. Analyze on-chain code in one click."
                            gradient="from-violet-500/20 to-purple-600/10"
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={FileText}
                            title="Instant Reports"
                            description="Get comprehensive security reports with risk scores, fix recommendations, and exportable PDF/JSON reports for your team."
                            gradient="from-cyan-500/20 to-teal-600/10"
                            delay={0.3}
                        />
                    </div>

                    {/* Secondary features */}
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {[
                            { icon: Zap, label: 'AI-Powered Fixes', desc: 'Auto-generated code patches' },
                            { icon: Layers, label: 'Analysis History', desc: 'Track all past scans' },
                            { icon: Lock, label: 'Security First', desc: 'Keys never leave your env' },
                            { icon: Cpu, label: 'AI Chat Assistant', desc: 'Ask questions about findings' },
                        ].map((feat, i) => (
                            <motion.div
                                key={feat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 * i }}
                                className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-300 group"
                            >
                                <feat.icon className="w-5 h-5 text-blue-400 mb-3 group-hover:text-violet-400 transition-colors" />
                                <p className="text-sm font-semibold text-white mb-1">{feat.label}</p>
                                <p className="text-xs text-muted-foreground">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ STATS ═══════════ */}
            <section className="py-24 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent" />
                <div className="max-w-5xl mx-auto relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="text-sm font-semibold text-violet-400 tracking-wider uppercase mb-4 block">By the Numbers</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Trusted Analysis <span className="text-gradient">Platform</span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { value: stats?.total_analyses || 0, label: 'Contracts Scanned', suffix: '+' },
                            { value: stats?.total_vulnerabilities || 0, label: 'Vulnerabilities Found', suffix: '+' },
                            { value: 6, label: 'Blockchain Networks', suffix: '' },
                            { value: stats?.total_contracts || 0, label: 'Unique Contracts', suffix: '+' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 * i }}
                                className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                           hover:bg-white/[0.06] transition-all duration-300"
                            >
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2000 + i * 300} />
                                </div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ TECHNOLOGY ═══════════ */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <span className="text-sm font-semibold text-cyan-400 tracking-wider uppercase mb-4 block">Technology Stack</span>
                        <h2 className="text-3xl font-bold text-white mb-3">
                            Built with Industry-Leading Tools
                        </h2>
                        <p className="text-muted-foreground">Enterprise-grade tech stack for reliable security analysis</p>
                    </motion.div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {['Google Gemini AI', 'FastAPI', 'React', 'TypeScript', 'Solidity', 'Ethereum', 'Polygon', 'Docker',
                            'Monaco Editor', 'Tailwind CSS', 'Framer Motion', 'SQLite'].map((tech, i) => (
                                <TechBadge key={tech} name={tech} delay={0.05 * i} />
                            ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ CTA ═══════════ */}
            <section className="py-32 px-6 relative">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full
                          bg-gradient-to-t from-blue-600/15 via-violet-600/10 to-transparent blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Secure Your<br />
                        <span className="text-gradient">Smart Contracts?</span>
                    </h2>
                    <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                        Start your free analysis in seconds. No sign-up required.
                        Just paste your code and let AI do the rest.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            onClick={() => navigate('/scan')}
                            className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-blue-600 to-violet-600
                         hover:from-blue-500 hover:to-violet-500 shadow-2xl shadow-blue-500/25
                         border-0 gap-3 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-105"
                        >
                            <Zap className="w-5 h-5" />
                            Start Free Analysis
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="py-10 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white">ContractShield</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © 2026 ContractShield. AI-powered smart contract security.
                    </p>
                    <a
                        href="https://github.com/KartikJoshi23/Smart-Contract-Scanner"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                        GitHub →
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
