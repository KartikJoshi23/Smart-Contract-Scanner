import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, type HistoryItem } from '@/services/api';
import Loading from '@/components/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  History as HistoryIcon,
  Search,
  Shield,
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  FileCode,
  XCircle,
  Inbox,
} from 'lucide-react';

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

const getRiskBadgeClasses = (score: number) => {
  if (score >= 70) return 'bg-red-500/10 border-red-500/30 text-red-400';
  if (score >= 50) return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
  if (score >= 30) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  if (score > 0) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const History = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  const fetchHistory = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const data = await getHistory(PAGE_SIZE, offset);

      if (append) {
        setItems((prev) => [...prev, ...data]);
      } else {
        setItems(data);
      }

      setHasMore(data.length === PAGE_SIZE);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch history');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLoadMore = () => {
    fetchHistory(items.length, true);
  };

  const handleRefresh = () => {
    fetchHistory();
  };

  const filteredItems = items.filter((item) =>
    item.contract_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Loading message="Loading history..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <HistoryIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analysis History</h1>
              <p className="text-muted-foreground text-sm">
                {items.length} past {items.length === 1 ? 'analysis' : 'analyses'}
              </p>
            </div>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                className="pl-10 w-64 bg-background/50 border-white/10 focus:border-blue-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 border-white/10 hover:bg-white/5"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Failed to Load History</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredItems.length === 0 && (
          <Card className="glass-card gradient-border overflow-hidden">
            <CardContent className="p-0">
              <div className="relative py-20 px-6">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative text-center max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Inbox className="w-10 h-10 text-muted-foreground/50" />
                  </div>

                  <h2 className="text-xl font-bold text-white mb-3">
                    {searchQuery ? 'No Matching Results' : 'No Analyses Yet'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {searchQuery
                      ? `No contracts found matching "${searchQuery}". Try a different search term.`
                      : 'Run your first contract analysis from the Scanner page. Your history will appear here.'}
                  </p>

                  {!searchQuery && (
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                      onClick={() => navigate('/scan')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Go to Scanner
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History List */}
        {filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="glass-card gradient-border overflow-hidden group hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/analysis/${item.id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-5">
                    {/* Risk Score Circle */}
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${item.risk_score >= 70
                        ? 'bg-red-500/10 border-red-500/20'
                        : item.risk_score >= 50
                          ? 'bg-orange-500/10 border-orange-500/20'
                          : item.risk_score >= 30
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : item.risk_score > 0
                              ? 'bg-emerald-500/10 border-emerald-500/20'
                              : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                        <span className={`text-lg font-bold ${getRiskColor(item.risk_score)}`}>
                          {item.risk_score}
                        </span>
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
                        <h3 className="text-white font-semibold truncate">
                          {item.contract_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge
                          variant="outline"
                          className="bg-white/5 border-white/10 text-muted-foreground text-xs capitalize"
                        >
                          {item.network}
                        </Badge>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Vulnerability Count */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-white font-semibold text-sm">
                            {item.vulnerability_count}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">vulns</span>
                      </div>

                      {/* Risk Badge */}
                      <Badge
                        variant="outline"
                        className={`font-semibold ${getRiskBadgeClasses(item.risk_score)}`}
                      >
                        {getRiskLabel(item.risk_score)}
                      </Badge>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 gap-2"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;