const SkeletonCard = ({ lines = 3 }: { lines?: number }) => {
    return (
        <div className="bg-background/50 rounded-xl border border-white/5 p-5 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
                <div className="w-16 h-6 bg-white/10 rounded-full shrink-0" />
            </div>
            {lines > 1 && (
                <div className="mt-4 space-y-2">
                    {Array.from({ length: lines - 1 }).map((_, i) => (
                        <div key={i} className="h-3 bg-white/5 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SkeletonCard;
