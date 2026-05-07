import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ScannerProvider } from '@/context/ScannerContext';
import { ChatProvider, useChat } from '@/context/ChatContext';
import Header from '@/components/Header';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import Scanner from '@/pages/Scanner';
import History from '@/pages/History';
import Stats from '@/pages/Stats';
import AnalysisDetail from '@/pages/AnalysisDetail';
import ChatPanel from '@/components/ChatPanel';
import Toaster from '@/components/ui/toast';

// ── Creative Robot SVG Chat Button ──
const RobotChatButton = () => {
  const { isChatOpen, setIsChatOpen, setChatQuestion } = useChat();
  const location = useLocation();

  // Hide on landing page
  if (location.pathname === '/') return null;

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => {
            setChatQuestion(undefined);
            setIsChatOpen(true);
          }}
          className="fixed bottom-6 right-6 z-30 w-16 h-16 rounded-2xl
                     bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700
                     hover:from-violet-500 hover:via-purple-500 hover:to-indigo-600
                     shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40
                     flex items-center justify-center
                     transition-all duration-300 hover:scale-110 hover:-translate-y-0.5
                     group border border-white/10"
          title="AI Security Assistant (Ctrl+K)"
          aria-label="Open AI Security Assistant"
        >
          {/* Creative Robot Face SVG */}
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none" className="drop-shadow-sm">
            {/* Antenna */}
            <line x1="20" y1="2" x2="20" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" className="group-hover:animate-bounce" />
            <circle cx="20" cy="2" r="2.5" fill="#a78bfa" className="group-hover:fill-cyan-400 transition-colors duration-300" />

            {/* Head */}
            <rect x="6" y="8" width="28" height="22" rx="6" fill="white" fillOpacity="0.15"
              stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />

            {/* Eyes */}
            <circle cx="14" cy="18" r="3.5" fill="#a78bfa" className="group-hover:fill-cyan-400 transition-colors duration-500" />
            <circle cx="26" cy="18" r="3.5" fill="#a78bfa" className="group-hover:fill-cyan-400 transition-colors duration-500" />
            {/* Eye shine */}
            <circle cx="15.2" cy="16.8" r="1.2" fill="white" fillOpacity="0.8" />
            <circle cx="27.2" cy="16.8" r="1.2" fill="white" fillOpacity="0.8" />

            {/* Mouth — friendly smile */}
            <path d="M14 24 Q20 28 26 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.7" />

            {/* Ears */}
            <rect x="2" y="14" width="4" height="8" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
            <rect x="34" y="14" width="4" height="8" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

            {/* Body hint */}
            <rect x="12" y="30" width="16" height="6" rx="3" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
          </svg>

          {/* Subtle glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      )}
    </>
  );
};

// ── Global Chat Panel Wrapper ──
const GlobalChat = () => {
  const { isChatOpen, setIsChatOpen, chatQuestion, setChatQuestion, analysisId } = useChat();

  return (
    <ChatPanel
      isOpen={isChatOpen}
      onClose={() => {
        setIsChatOpen(false);
        setChatQuestion(undefined);
      }}
      analysisId={analysisId}
      initialQuestion={chatQuestion}
    />
  );
};

// ── Layout Wrapper (handles header visibility) ──
const AppLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      {!isLanding && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
      <RobotChatButton />
      <GlobalChat />
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <ScannerProvider>
      <ChatProvider>
        <Router>
          <AppLayout />
        </Router>
      </ChatProvider>
    </ScannerProvider>
  );
}

export default App;