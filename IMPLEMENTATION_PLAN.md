# Smart Contract Security Scanner — Implementation Plan

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [AI Integration](#ai-integration)
8. [File Structure](#file-structure)
9. [Development Phases](#development-phases)
10. [Deployment Strategy](#deployment-strategy)
11. [Security Considerations](#security-considerations)
12. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

### What is This Project?

An AI-powered smart contract vulnerability detection tool that:
- Analyzes Solidity smart contracts for security vulnerabilities
- Uses Google Gemini 2.5 Flash AI for detection and explanation
- Fetches verified contracts from blockchain via Alchemy/Etherscan APIs
- Generates comprehensive security reports with fix recommendations
- Supports 6 blockchain networks (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base)

### Why This Project?

- Smart contract hacks cause billions in losses annually
- Traditional audits are expensive and slow
- AI can provide instant, accessible security analysis
- Demonstrates advanced full-stack + AI + blockchain skills

### Target Users

- Smart contract developers
- Security researchers
- DeFi project teams
- Blockchain startups
- Individual developers learning Solidity

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose | Status |
|------------|---------|--------|
| Python 3.11+ | Backend language | ✅ Active |
| FastAPI | Web framework | ✅ Active |
| SQLAlchemy | ORM | ✅ Active |
| SQLite | Database | ✅ Active |
| Pydantic | Validation | ✅ Active |
| Uvicorn | ASGI Server | ✅ Active |

### AI/ML

| Technology | Purpose | Status |
|------------|---------|--------|
| Google Gemini 2.5 Flash | Vulnerability detection + explanation | ✅ Active |
| ~~Ollama~~ | ~~Local AI runtime~~ | ❌ Replaced by Gemini |
| ~~DeepSeek Coder V2~~ | ~~Vulnerability detection~~ | ❌ Replaced by Gemini |
| ~~Llama 3.1 8B~~ | ~~Explanations~~ | ❌ Replaced by Gemini |

### Frontend

| Technology | Purpose | Status |
|------------|---------|--------|
| React 18 | UI framework | ✅ Active |
| TypeScript | Type safety | ✅ Active |
| Vite | Build tool | ✅ Active |
| Tailwind CSS | Styling | ✅ Active |
| Radix UI | Component primitives | ✅ Active |
| React Context API | State management | ✅ Active |
| Axios | HTTP client | ✅ Active |
| Monaco Editor | Code editor | ✅ Active |
| Framer Motion | Animations | ✅ Active |
| Lucide React | Icons | ✅ Active |

### Blockchain Tools

| Technology | Purpose | Status |
|------------|---------|--------|
| Alchemy API | Contract verification via RPC | ✅ Active |
| Etherscan APIs | Fetch verified source code | ✅ Active |
| Foundry | Testing framework | 🟡 Structure only |

### DevOps & Tools

| Technology | Purpose | Status |
|------------|---------|--------|
| Docker | Containerization | ✅ Active |
| Git/GitHub | Version control | ✅ Active |
| GitHub Actions | CI/CD | ✅ Active |

---

## 🏗️ Architecture

### Current Architecture (Active)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│              (React + TypeScript + Vite + Tailwind)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Scanner  │  │  Stats   │  │ History  │                      │
│  │   Page   │  │   Page   │  │   Page   │                      │
│  │ (Active) │  │ (Active) │  │(Placeholder)                    │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ HTTP/REST API (via Vite proxy)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    (FastAPI — main.py)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      API Endpoints                        │   │
│  │  POST /api/analyze       GET /api/stats                   │   │
│  │  POST /api/fetch-contract GET /api/history                │   │
│  │  GET /api/contract-info   GET /api/health                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ scanner.py   │  │ alchemy_     │  │  schemas.py  │          │
│  │ (Orchestrator│  │ service.py   │  │ (Validation) │          │
│  │  → Gemini)   │  │ (Blockchain) │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Gemini     │   │   Alchemy    │   │    SQLite     │
│    API       │   │  + Etherscan │   │   Database    │
│              │   │    APIs      │   │              │
│ - Detection  │   │ - Verify Addr│   │ - Contracts  │
│ - Explanation│   │ - Fetch Code │   │ - Analyses   │
│ - Fix Gen    │   │ - Get Balance│   │ - Vulns      │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## ✨ Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Code Upload | Submit Solidity code via Monaco editor | ✅ Done |
| AI Detection | Use Gemini 2.5 Flash to find vulnerabilities | ✅ Done |
| AI Explanation | Gemini generates detailed explanations | ✅ Done |
| Fix Suggestions | Provide corrected code snippets | ✅ Done |
| Fetch by Address | Fetch verified source from blockchain | ✅ Done |
| Multi-Network | 6 networks supported | ✅ Done |
| Analysis History | Backend API stores and serves history | ✅ Backend Done |
| Statistics | Overall app statistics dashboard | ✅ Done |
| Health Check | Service health monitoring | ✅ Done |
| Context API State | Scanner state shared across components | ✅ Done |

### Vulnerability Types Detected

| Type | Description | Severity |
|------|-------------|----------|
| Reentrancy | External calls before state updates | Critical |
| Integer Overflow | Math without SafeMath (pre-0.8.0) | High |
| Access Control | Missing/improper access restrictions | High |
| Unchecked Calls | Low-level calls without checks | Medium |
| Frontrunning | MEV/sandwich attack vulnerable | Medium |
| Logic Bugs | Business logic vulnerabilities | Varies |
| Gas Optimization | Expensive operations | Low/Info |

### Features Remaining

| Feature | Description | Priority | Effort |
|---------|-------------|----------|--------|
| History Page UI | Wire up frontend to existing API | ✅ Done | Low |
| `.env.example` / Security | Protect exposed API keys | ✅ Done | Low |
| README Documentation | Setup instructions, API docs | ✅ Done | Low |
| Docker Setup | Populate Dockerfiles for deployment | ✅ Done | Low |
| Export (JSON/PDF) | Download analysis reports | ✅ Done | Medium |
| Dead Code Cleanup | Remove unused `app/` module or migrate | ✅ Done | Medium |
| CI/CD Pipelines | Populate GitHub Actions workflows | ✅ Done | Medium |
| Slither Integration | Professional static analysis | 🟢 Low | High |
| Mythril Integration | Symbolic execution analysis | 🟢 Low | High |
| Foundry Integration | Compile + test contracts | 🟢 Low | High |
| WebSocket Progress | Real-time scan progress updates | 🟢 Low | Medium |

---

## 🗄️ Database Schema

### Tables (Current Active Schema)

#### contracts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Primary key |
| name | VARCHAR(255) | NOT NULL | Contract name |
| source_code | TEXT | NOT NULL | Solidity source code |
| network | VARCHAR(50) | DEFAULT 'ethereum' | Blockchain network |
| address | VARCHAR(42) | NULLABLE | On-chain address |
| created_at | DATETIME | DEFAULT NOW | Creation time |

#### analyses
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Primary key |
| contract_id | Integer | FK → contracts.id | Reference to contract |
| risk_score | Integer | DEFAULT 0 | 0-100 score |
| summary | TEXT | NULLABLE | AI-generated summary |
| scan_duration_ms | Integer | NULLABLE | Time taken |
| created_at | DATETIME | DEFAULT NOW | Start time |

#### vulnerabilities
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto | Primary key |
| analysis_id | Integer | FK → analyses.id | Reference to analysis |
| title | VARCHAR(255) | NOT NULL | Vulnerability name |
| severity | VARCHAR(20) | NOT NULL | critical/high/medium/low/info |
| category | VARCHAR(100) | NULLABLE | Vulnerability category |
| description | TEXT | NULLABLE | What's wrong |
| impact | TEXT | NULLABLE | Why dangerous |
| recommendation | TEXT | NULLABLE | How to fix |
| vulnerable_code | TEXT | NULLABLE | Affected code snippet |
| fixed_code | TEXT | NULLABLE | Corrected code |
| line_start | Integer | NULLABLE | Start line |
| line_end | Integer | NULLABLE | End line |
| function_name | VARCHAR(255) | NULLABLE | Affected function |
| confidence | VARCHAR(20) | DEFAULT 'medium' | AI confidence |
| created_at | DATETIME | DEFAULT NOW | Creation time |

---

## 🔌 API Endpoints (Current Active)

### Health & Status
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/` | Root info | ✅ Working |
| GET | `/api/health` | Full health check | ✅ Working |

### Analysis
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/analyze` | Analyze by source code | ✅ Working |
| POST | `/api/fetch-contract` | Fetch contract from blockchain | ✅ Working |
| GET | `/api/contract-info/{network}/{address}` | Get contract info | ✅ Working |

### History & Stats
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/history` | Get analysis history (paginated) | ✅ Working |
| GET | `/api/stats` | Overall statistics | ✅ Working |

### Reports (Planned)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/reports/{id}/json` | Download JSON report | ✅ Working |
| GET | `/api/reports/{id}/pdf` | Download PDF report | ✅ Working |

---

## 🤖 AI Integration

### Current: Google Gemini 2.5 Flash

- **API**: Google Generative AI SDK (`google.generativeai`)
- **Model**: `gemini-2.5-flash`
- **Temperature**: 0.1 (low for consistent output)
- **Max Output Tokens**: 8192
- **Response Format**: JSON with vulnerabilities array, risk_score, summary

### Prompt Structure

The prompt instructs Gemini to act as a smart contract security expert and return:
- `risk_score` (0-100)
- `summary` (brief security status)
- `vulnerabilities[]` with: title, severity, category, description, impact, recommendation, vulnerable_code, fixed_code, line_start, line_end, function_name, confidence

---

## 📁 File Structure (Actual)

```
Smart-Contract-Scanner/
├── backend/
│   ├── main.py                     # ← ACTIVE entry point
│   ├── scanner.py                  # ← ACTIVE AI orchestrator
│   ├── models.py                   # ← ACTIVE SQLAlchemy models
│   ├── schemas.py                  # ← ACTIVE Pydantic schemas
│   ├── database.py                 # ← ACTIVE DB connection
│   ├── services/
│   │   ├── alchemy_service.py      # ← ACTIVE blockchain integration
│   │   └── gemini_service.py       # ← ACTIVE Gemini AI service
│   ├── app/                        # ⚠️ LEGACY — Ollama-based code, NOT USED
│   │   ├── api/routes/             # (analyze, contracts, health, reports, stats)
│   │   ├── core/                   # (config, exceptions, logging)
│   │   ├── db/                     # (database, models, crud)
│   │   ├── prompts/                # (detection, explanation)
│   │   ├── schemas/                # (analysis, common, contract, vulnerability)
│   │   ├── services/               # (ai_analyzer, orchestrator — EMPTY STUBS)
│   │   └── utils/
│   ├── tests/                      # Test structure (uses app/ module)
│   ├── .env                        # ⚠️ Contains actual API keys
│   ├── requirements.txt
│   ├── Dockerfile                  # ❌ EMPTY
│   └── Dockerfile.dev              # ❌ EMPTY
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Scanner.tsx         # ✅ Fully functional
│   │   │   ├── Stats.tsx           # ✅ Fully functional
│   │   │   └── History.tsx         # ✅ Fully functional
│   │   ├── components/             # Header, Loading, SeverityBadge, VulnerabilityCard, ui/
│   │   ├── context/ScannerContext.tsx # ✅ State management
│   │   ├── services/api.ts         # ✅ All API functions
│   │   ├── types/index.ts          # ⚠️ Unused (old types)
│   │   ├── hooks/useLocalStorage.ts
│   │   └── lib/utils.ts
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── contracts/                      # Foundry project (structure only)
├── docs/                           # API.md, ARCHITECTURE.md, DEPLOYMENT.md, CONTRIBUTING.md
├── .github/workflows/              # ✅ ci.yml, deploy.yml, security.yml — Active
├── scripts/                        # Shell scripts (setup, pull-models, seed-db, generate-tests)
├── IMPLEMENTATION_PLAN.md          # ← This file
├── README.md                       # ✅ Complete documentation
├── .env.example                    # ✅ Template with instructions
├── Makefile                        # ✅ Dev/Docker/Clean targets
├── docker-compose.yml              # ✅ Production Docker setup
└── docker-compose.dev.yml          # ✅ Dev Docker setup
```

---

## 📅 Development Phases

### Phase 1: Backend Foundation ✅ COMPLETED
- [x] Project structure setup
- [x] Database models (Contract, Analysis, Vulnerability)
- [x] API schemas (Pydantic)
- [x] Basic API routes (analyze, health, stats, history)
- [x] FastAPI configuration with CORS
- [x] Health check endpoints

### Phase 2: AI Integration ✅ COMPLETED (Modified)
- [x] ~~Ollama setup~~ → Replaced with Gemini API
- [x] ~~Model download~~ → Using cloud API
- [x] Detection prompts (single Gemini prompt)
- [x] ~~Explanation prompts~~ → Combined in single Gemini call
- [x] AI service class (`gemini_service.py`)
- [x] Scanner orchestrator (`scanner.py`)

### Phase 3: Frontend Development ✅ COMPLETED
- [x] React + TypeScript + Vite project setup
- [x] Component library (Radix UI + custom components)
- [x] Scanner page (code paste + address fetch)
- [x] Statistics page
- [x] Responsive design with Tailwind
- [x] Monaco code editor integration
- [x] Context API state management
- [x] History page (functional with search, pagination, error handling)
- [x] Export/download results from UI (JSON + PDF)

### Phase 4: Blockchain Integration ✅ COMPLETED
- [x] Alchemy API integration
- [x] Etherscan-compatible APIs for source code
- [x] Multi-network support (6 networks)
- [x] Contract address validation
- [x] Frontend "Fetch by Address" tab

### Phase 5: Remaining Features ✅ COMPLETED
- [x] Functional History page UI
- [x] PDF report generation
- [x] JSON export from UI
- [x] `.env.example` and security fix
- [x] README documentation
- [x] Docker setup (Dockerfiles + compose)
- [x] CI/CD pipelines
- [x] Dead code cleanup

### Phase 6: AI Security Chatbot 📋 PLANNED — HIGH IMPACT

A context-aware AI assistant that understands the current contract and its vulnerabilities. Uses Gemini 2.5 Flash free tier.

#### Backend
- [ ] `POST /api/chat` — Accepts message + optional `analysis_id`, returns streamed AI response
- [ ] `GET /api/chat/history/{analysis_id}` — Retrieve past chat messages for an analysis
- [ ] `chat_service.py` — Builds context from contract code + vulnerabilities + conversation history
- [ ] `ChatMessage` + `ChatSession` SQLAlchemy models (session_id, role, content, analysis_id, created_at)
- [ ] System prompt engineering: "You are a Solidity security expert. The user has just scanned a contract. Here is the contract code and the vulnerabilities found. Answer questions, explain vulnerabilities in depth, suggest secure patterns, and help write fixes."
- [ ] Streaming responses via `StreamingResponse` + Server-Sent Events (SSE)
- [ ] Context window management — truncate older messages when approaching Gemini's token limit

#### Frontend
- [ ] `ChatPanel.tsx` — Slide-out drawer (right side) with chat interface
- [ ] Floating chat bubble button (bottom-right, glowing pulse animation)
- [ ] Message bubbles with markdown rendering (using `react-markdown`)
- [ ] Syntax-highlighted code blocks inside chat (Solidity, JSON)
- [ ] Typing indicator with animated dots
- [ ] "Ask about this vulnerability" quick-action button on each `VulnerabilityCard`
- [ ] Pre-built quick prompts: "Explain this vulnerability", "How do I fix this?", "Is this a false positive?", "Write a test for this", "What's the attack vector?"
- [ ] Chat history persistence per analysis session
- [ ] Auto-scroll to latest message, manual scroll lock
- [ ] Mobile-responsive: full-screen on small screens

#### Conversation Context Architecture
```
System Prompt (static)
  + Contract Source Code (from current analysis)
  + Vulnerability Report JSON (from current analysis)
  + Conversation History (last N messages)
  → Gemini 2.5 Flash → Streamed response
```

---

### Phase 7: Professional UX Overhaul 📋 PLANNED

Transform the UI from good to truly state-of-the-art.

#### Dedicated Analysis Detail Page
- [ ] `/analysis/:id` route — Full-page view of a single analysis
- [ ] Side-by-side code diff viewer (vulnerable code vs. fixed code) using Monaco diff editor
- [ ] Interactive vulnerability map — Click vulnerability to highlight its location in the code
- [ ] Line-gutter decorations in Monaco showing vulnerability markers (red/yellow/blue dots)
- [ ] Severity breakdown donut chart (using lightweight SVG, no chart library needed)
- [ ] Deep-link sharing — Copy analysis URL to share results

#### Dashboard Homepage (New Landing)
- [ ] `/dashboard` route (make this the default, move Scanner to `/scan`)
- [ ] Recent scans widget (last 5 analyses with risk scores)
- [ ] Quick-stats banner (contracts scanned today, highest risk found, avg score)
- [ ] "Quick Scan" button that jumps to Scanner page
- [ ] Animated counter for total lifetime scans
- [ ] Activity sparkline chart (scans per day, last 7 days — pure SVG, no dependencies)

#### UI Polish
- [ ] Toast notifications system (scan complete, export success, errors) using Radix Toast
- [ ] Keyboard shortcuts: `Ctrl+Enter` = analyze, `Ctrl+K` = open chatbot, `Esc` = close panels
- [ ] Loading skeleton screens instead of spinners (scan results, history cards)
- [ ] Animated risk gauge (circular SVG animation on results load)
- [ ] Smooth page transition animations with Framer Motion `AnimatePresence`
- [ ] Code editor line highlighting for vulnerable lines (red underline decorations)
- [ ] "Copy to clipboard" buttons on code snippets and vulnerability details
- [ ] Responsive mobile layout — collapsible sidebar, stacked panels on small screens

#### ERC Standard Compliance Checker (Bonus UI Section)
- [ ] Dropdown: select ERC standard (ERC-20, ERC-721, ERC-1155, ERC-4626)
- [ ] Display compliance checklist — which required functions are present/missing
- [ ] Gemini prompt specifically checks interface compliance + common standard pitfalls

---

### Phase 8: Backend Hardening & Advanced Analysis 📋 PLANNED

#### Rate Limiting & API Security
- [ ] Configure `slowapi` rate limiter (already installed): 10 analysis/min per IP, 60 chat/min
- [ ] Add security headers middleware (X-Content-Type-Options, X-Frame-Options, CSP)
- [ ] CORS: make origins configurable via environment variable
- [ ] Request ID tracking — UUID per request, included in all logs and responses
- [ ] Structured JSON logging with `structlog` or Python's built-in logging

#### Analysis Engine Improvements
- [ ] Multi-file contract support — Parse Etherscan's multi-file JSON, analyze each file individually, then synthesize
- [ ] Analysis caching — SHA-256 hash of contract code, skip re-analysis if exact same code was scanned before
- [ ] Severity statistics per analysis — `{critical: N, high: N, medium: N, low: N, info: N}` in API response
- [ ] Re-scan endpoint — `POST /api/analyze/{id}/rescan` to re-analyze with latest AI model
- [ ] Comparison endpoint — `POST /api/compare` accepts two contract codes, returns diff + vulnerability delta

#### Gas Optimization Analysis Mode
- [ ] Separate Gemini prompt focused purely on gas optimization
- [ ] Toggle in frontend: "Security Scan" vs "Gas Optimization" mode
- [ ] Gas-specific recommendations: storage packing, calldata optimization, loop gas, SSTORE patterns

#### Database & Performance
- [ ] Database migration support with Alembic
- [ ] Indexes on `analyses.created_at`, `contracts.address`, `vulnerabilities.severity`
- [ ] Pagination with cursor-based approach (more efficient than offset for large datasets)
- [ ] Background task processing for analysis (return job ID immediately, poll for results)

---

### Phase 9: Production Readiness 📋 PLANNED

#### Testing
- [ ] Backend unit tests: API endpoint tests with `httpx.AsyncClient` + mock Gemini
- [ ] Backend integration tests: full analyze flow with test database
- [ ] Frontend component tests with Vitest + React Testing Library
- [ ] E2E smoke tests with Playwright (scan flow, history page, export)
- [ ] Test fixtures: sample vulnerable contracts for consistent testing

#### Observability
- [ ] Health check improvements: include DB row counts, last scan time, Gemini latency
- [ ] `/api/metrics` endpoint — Prometheus-compatible metrics (request count, latency histogram, error rate)
- [ ] Request duration logging on every endpoint
- [ ] Error tracking: catch-all exception handler with structured error responses

#### DevOps
- [ ] Multi-stage Docker builds with dependency caching (reduce rebuild time)
- [ ] `.dockerignore` files for backend and frontend
- [ ] Docker health check improvements (readiness vs. liveness)
- [ ] Environment-based config: `CONFIG_ENV=production|development|test`
- [ ] Pre-commit hooks: ruff + black + eslint auto-fix
- [ ] Conventional commits with commitlint
- [ ] CHANGELOG.md auto-generation

#### Documentation
- [ ] Interactive API docs enhancement (FastAPI's built-in Swagger UI is already live at `/docs`)
- [ ] Architecture diagram (Mermaid) embedded in README
- [ ] Contributing guide with development workflow
- [ ] Deployment guide for cloud providers (Railway, Render, Fly.io — all have free tiers)

---

## 🚀 Deployment Strategy

### Local Development

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev                 # Runs at localhost:5173
```

### Docker (Active)

```bash
# Production
docker-compose up --build      # Backend :8000, Frontend :3000

# Development (hot-reload)
docker-compose -f docker-compose.dev.yml up --build
```

---

## 🔒 Security Considerations

### Resolved
- ✅ `.env.example` provides clear guidance for API key setup
- ✅ `.gitignore` protects `.env` files from being committed
- ✅ All inputs validated via Pydantic schemas
- ✅ Contract address format validation (0x + 42 chars)

### Active Protections
- CORS configured for localhost origins
- Gemini API with structured JSON output and response sanitization
- JSON parsing with fallbacks and cleaning
- Environment variables for secrets

### Planned Improvements
- [ ] `slowapi` rate limiting activation
- [ ] Security headers middleware
- [ ] Configurable CORS origins
- [ ] Request ID tracking

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 60s | ~30-60s (Gemini) |
| Detection Accuracy | > 85% | TBD |
| False Positive Rate | < 15% | TBD |
| Test Coverage | > 80% | 0% |
| Networks Supported | 6+ | 6 ✅ |
| Chatbot Response Time | < 5s | Not yet implemented |
| Export Formats | JSON + PDF | JSON + PDF ✅ |
| CI/CD Pipelines | 3 workflows | 3 ✅ |

---

## 📚 Resources & References

### Solidity Security
- [SWC Registry](https://swcregistry.io/) — Smart Contract Weakness Classification
- [Consensys Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)

### Tools
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [Foundry Book](https://book.getfoundry.sh/)

---

## 📞 Contact

- **GitHub**: [KartikJoshi23](https://github.com/KartikJoshi23)
- **Project**: [Smart-Contract-Scanner](https://github.com/KartikJoshi23/Smart-Contract-Scanner)
- **Last Updated**: February 2026
