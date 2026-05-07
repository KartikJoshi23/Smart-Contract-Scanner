import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Zap, History, BarChart3, Circle, Github, LayoutDashboard, Home } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scan', label: 'Scanner', icon: Zap },
    { path: '/history', label: 'History', icon: History },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-white/5" />

      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-white">Contract</span>
              <span className="text-gradient">Shield</span>
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 font-medium">AI Security Scanner</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 rounded-full px-4 transition-all duration-200 ${active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* GitHub Link */}
          <a
            href="https://github.com/KartikJoshi23/Smart-Contract-Scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;