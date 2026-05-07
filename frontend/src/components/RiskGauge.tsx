import { useEffect, useState } from 'react';

interface RiskGaugeProps {
    score: number;
    size?: number;
}

const RiskGauge = ({ score, size = 120 }: RiskGaugeProps) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    const getColor = (s: number) => {
        if (s >= 70) return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.3)' };
        if (s >= 50) return { stroke: '#f97316', glow: 'rgba(249,115,22,0.3)' };
        if (s >= 30) return { stroke: '#eab308', glow: 'rgba(234,179,8,0.3)' };
        if (s > 0) return { stroke: '#22c55e', glow: 'rgba(34,197,94,0.3)' };
        return { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.3)' };
    };

    const getLabel = (s: number) => {
        if (s >= 70) return 'Critical';
        if (s >= 50) return 'High';
        if (s >= 30) return 'Medium';
        if (s > 0) return 'Low';
        return 'Safe';
    };

    const { stroke, glow } = getColor(animatedScore);
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashLen = (animatedScore / 100) * circumference;
    const half = size / 2;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Glow */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-50 transition-all duration-1000"
                style={{ background: glow }}
            />

            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative -rotate-90">
                {/* Track */}
                <circle
                    cx={half} cy={half} r={radius}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"
                />
                {/* Progress */}
                <circle
                    cx={half} cy={half} r={radius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dashLen} ${circumference}`}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{animatedScore}</span>
                <span className="text-[10px] font-medium" style={{ color: stroke }}>{getLabel(animatedScore)}</span>
            </div>
        </div>
    );
};

export default RiskGauge;
