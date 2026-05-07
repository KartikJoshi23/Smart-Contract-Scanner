import { useState, useEffect } from 'react';
import { getStats, getHealth, type StatsResponse, type HealthResponse } from '@/services/api';
import Loading from '@/components/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Database,
  Cpu,
  Activity,
  Shield,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Server,
  Zap,
  TrendingUp
} from 'lucide-react';

const Stats = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, healthData] = await Promise.all([
          getStats(),
          getHealth(),
        ]);
        setStats(statsData);
        setHealth(healthData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch statistics');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Loading message="Loading statistics..." />
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const isOnline = ['connected', 'healthy', 'available'].includes(status.toLowerCase());
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 font-semibold ${isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
      >
        {isOnline ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl blur-lg opacity-50" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Statistics & Health</h1>
            <p className="text-muted-foreground text-sm">System status and analysis metrics</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Failed to Load</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* System Health Card */}
        {health && (
          <Card className="glass-card gradient-border overflow-hidden mb-6">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-5 border-b border-white/5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">System Health</h2>
                  <p className="text-xs text-muted-foreground">Real-time service status</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">API Status</span>
                    </div>
                    <StatusBadge status={health.status} />
                  </div>

                  <div className="stat-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Database</span>
                    </div>
                    <StatusBadge status={health.services.database} />
                  </div>

                  <div className="stat-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Gemini AI</span>
                    </div>
                    <StatusBadge status={health.services.ai} />
                  </div>

                  <div className="stat-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Version</span>
                    </div>
                    <span className="text-white font-bold text-lg">{health.version}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Grid */}
        {stats && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Analytics Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="glass-card gradient-border overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20">
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.total_contracts}</div>
                  <div className="text-sm text-muted-foreground">Total Contracts</div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center border border-violet-500/20">
                      <Activity className="w-6 h-6 text-violet-400" />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.total_analyses}</div>
                  <div className="text-sm text-muted-foreground">Total Analyses</div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center border border-red-500/20">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.total_vulnerabilities}</div>
                  <div className="text-sm text-muted-foreground">Vulnerabilities Found</div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.scans_today}</div>
                  <div className="text-sm text-muted-foreground">Scans Today</div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center border border-cyan-500/20">
                      <Calendar className="w-6 h-6 text-cyan-400" />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.scans_this_week}</div>
                  <div className="text-sm text-muted-foreground">Scans This Week</div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {Math.round((stats.average_scan_time_ms || 0) / 1000)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Scan Time</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;