# Smart Contract Security Scanner - Implementation Plan

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
- Uses local AI models (via Ollama) for detection and explanation
- Generates comprehensive security reports
- Provides fix recommendations with corrected code

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

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| Python 3.11+ | Backend language | Great AI/ML ecosystem, fast development |
| FastAPI | Web framework | Modern, async, auto-documentation |
| SQLAlchemy | ORM | Database abstraction, easy migrations |
| SQLite | Database | Simple, no setup, file-based |
| Pydantic | Validation | Type safety, automatic validation |
| Uvicorn | ASGI Server | High performance, async support |

### AI/ML

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| Ollama | Local AI runtime | Privacy, no API costs, offline capable |
| DeepSeek Coder V2 | Vulnerability detection | Excellent code understanding |
| Llama 3.1 8B | Explanations | Good at natural language |

### Frontend (To Be Built)

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| React 18 | UI framework | Industry standard, large ecosystem |
| TypeScript | Type safety | Fewer bugs, better DX |
| Vite | Build tool | Fast development, modern |
| Tailwind CSS | Styling | Rapid UI development |
| Zustand | State management | Simple, lightweight |
| React Query | Data fetching | Caching, loading states |

### DevOps & Tools

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| Docker | Containerization | Consistent environments |
| Git/GitHub | Version control | Industry standard |
| GitHub Actions | CI/CD | Free, integrated |

### Blockchain Tools

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| Foundry | Testing framework | Fast, modern, Solidity-native |
| Alchemy API | Blockchain RPC | Reliable, free tier |

---

## 🏗️ Architecture

### High-Level Architecture
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React + TypeScript)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Upload  │  │ Analysis │  │  Report  │  │ History  │        │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
│
│ HTTP/REST API
▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    (FastAPI + Python)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API Layer                            │  │
│  │  /analyze/code  /contracts  /reports  /stats  /health    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Service Layer                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ AI Analyzer │  │ Orchestrator│  │Report Builder│      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Data Layer                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   Models    │  │    CRUD     │  │   Schemas   │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
│                                      │
▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐
│     SQLite       │                  │     Ollama       │
│    Database      │                  │   (Local AI)     │
│                  │                  │                  │
│ - Contracts      │                  │ - DeepSeek Coder │
│ - Analyses       │                  │ - Llama 3.1      │
│ - Vulnerabilities│                  │                  │
└──────────────────┘                  └──────────────────┘

shell
Copy code

### Request Flow

User uploads contract
│
▼
┌───────────────────┐
│ POST /analyze/code│
└───────────────────┘
│
▼
┌───────────────────┐
│ Validate Input    │ ── Invalid ──> Return 400 Error
└───────────────────┘
│ Valid
▼
┌───────────────────┐
│ Save Contract     │
│ to Database       │
└───────────────────┘
│
▼
┌───────────────────┐
│ Create Analysis   │
│ Record (PENDING)  │
└───────────────────┘
│
▼
┌───────────────────┐
│ Call DeepSeek     │
│ for Detection     │ ── Error ──> Mark FAILED, Return 500
└───────────────────┘
│ Success
▼
┌───────────────────┐
│ Parse Detected    │
│ Vulnerabilities   │
└───────────────────┘
│
▼
┌───────────────────┐
│ For Each Vuln:    │
│ Call Llama for    │
│ Explanation       │
└───────────────────┘
│
▼
┌───────────────────┐
│ Save All Results  │
│ Mark COMPLETED    │
└───────────────────┘
│
▼
┌───────────────────┐
│ Return Analysis   │
│ Results to User   │
└───────────────────┘
---

## ✨ Features

### Core Features (MVP)

| Feature | Description | Status |
|---------|-------------|--------|
| Code Upload | Submit Solidity code for analysis | ✅ Done |
| AI Detection | Use DeepSeek to find vulnerabilities | ✅ Done |
| AI Explanation | Use Llama to explain issues | ✅ Done |
| Fix Suggestions | Provide corrected code | ✅ Done |
| JSON Reports | Download results as JSON | ✅ Done |
| Analysis History | View past analyses | ✅ Done |
| Statistics | Overall app statistics | ✅ Done |
| Health Check | Service health monitoring | ✅ Done |

### Vulnerability Types Detected

| Type | Description | Severity |
|------|-------------|----------|
| Reentrancy | External calls before state updates | Critical |
| Integer Overflow | Math without SafeMath (pre-0.8.0) | High |
| Access Control | Missing/improper access restrictions | High |
| Unchecked Calls | Low-level calls without checks | Medium |
| Frontrunning | MEV/sandwich attack vulnerable | Medium |

### Planned Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Address Analysis | Fetch code from blockchain | High |
| PDF Reports | Generate PDF reports | Medium |
| Foundry Verification | Verify vulns with tests | Medium |
| Frontend UI | React-based interface | High |
| Authentication | User accounts | Low |
| Rate Limiting | Prevent abuse | Medium |

---

## 🗄️ Database Schema

### Entity Relationship Diagram
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Contract     │       │    Analysis     │       │ Vulnerability   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ name            │   │   │ contract_id(FK) │◄──┘   │ analysis_id(FK) │◄──┘
│ code            │   │   │ status          │       │ type            │
│ code_hash       │   │   │ overall_risk    │       │ severity        │
│ network         │   │   │ risk_score      │       │ confidence      │
│ address         │   └──►│ summary         │       │ line_start      │
│ verified        │       │ scan_duration   │       │ line_end        │
│ compiler_version│       │ total_lines     │       │ function_name   │
│ created_at      │       │ error_message   │       │ code_snippet    │
│ updated_at      │       │ created_at      │       │ description     │
└─────────────────┘       │ completed_at    │       │ impact          │
└─────────────────┘       │ recommendation  │
│ fixed_code      │
│ created_at      │
└─────────────────┘

Relationships:

Contract (1) ──────< Analysis (Many)
Analysis (1) ──────< Vulnerability (Many)
### Table Details

#### contracts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID |
| name | VARCHAR(255) | NOT NULL | Contract name |
| code | TEXT | NOT NULL | Solidity source code |
| code_hash | VARCHAR(64) | NOT NULL, INDEX | SHA256 hash |
| network | ENUM | DEFAULT 'polygon' | Blockchain network |
| address | VARCHAR(42) | NULLABLE, INDEX | On-chain address |
| verified | BOOLEAN | DEFAULT FALSE | Verified on explorer |
| compiler_version | VARCHAR(20) | NULLABLE | Solc version |
| created_at | DATETIME | DEFAULT NOW | Creation time |
| updated_at | DATETIME | ON UPDATE | Last update time |

#### analyses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID |
| contract_id | VARCHAR(36) | FK | Reference to contract |
| status | ENUM | DEFAULT 'pending' | Analysis status |
| overall_risk | ENUM | NULLABLE | Highest severity found |
| risk_score | INTEGER | NULLABLE | 0-100 score |
| summary | TEXT | NULLABLE | AI-generated summary |
| scan_duration_ms | INTEGER | NULLABLE | Time taken |
| total_lines | INTEGER | NULLABLE | Lines of code |
| vulnerable_lines | INTEGER | NULLABLE | Affected lines |
| functions_analyzed | INTEGER | NULLABLE | Function count |
| detection_model | VARCHAR(50) | DEFAULT | Model used |
| explanation_model | VARCHAR(50) | DEFAULT | Model used |
| error_message | TEXT | NULLABLE | If failed |
| created_at | DATETIME | DEFAULT NOW | Start time |
| completed_at | DATETIME | NULLABLE | End time |

#### vulnerabilities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID |
| analysis_id | VARCHAR(36) | FK | Reference to analysis |
| type | ENUM | NOT NULL | Vulnerability type |
| severity | ENUM | NOT NULL | Severity level |
| confidence | ENUM | DEFAULT 'medium' | AI confidence |
| verified | BOOLEAN | DEFAULT FALSE | Foundry verified |
| line_start | INTEGER | NULLABLE | Start line |
| line_end | INTEGER | NULLABLE | End line |
| function_name | VARCHAR(255) | NULLABLE | Affected function |
| code_snippet | TEXT | NULLABLE | Vulnerable code |
| description | TEXT | NOT NULL | What's wrong |
| impact | TEXT | NULLABLE | Why dangerous |
| recommendation | TEXT | NULLABLE | How to fix |
| fixed_code | TEXT | NULLABLE | Corrected code |
| gas_estimate | VARCHAR(50) | NULLABLE | Gas impact |
| references | JSON | NULLABLE | Resource links |
| test_code | TEXT | NULLABLE | Foundry test |
| test_output | TEXT | NULLABLE | Test result |
| created_at | DATETIME | DEFAULT NOW | Creation time |

---

## 🔌 API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Full health check |
| GET | /api/health/ping | Simple ping |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analyze/code | Analyze by source code |
| POST | /api/analyze/address | Analyze by address (planned) |
| GET | /api/analyze/{id} | Get analysis results |
| GET | /api/analyze/{id}/status | Get analysis progress |

### Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contracts | List all contracts |
| GET | /api/contracts/{id} | Get contract details |
| DELETE | /api/contracts/{id} | Delete contract |
| GET | /api/contracts/{id}/analyses | Get contract's analyses |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/{id}/json | Download JSON report |
| GET | /api/reports/{id}/pdf | Download PDF report (planned) |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | Overall statistics |
| GET | /api/stats/recent | Recent activity |

---

## 🤖 AI Integration

### Ollama Setup

Ollama runs locally and serves AI models via REST API.

**Base URL:** `http://localhost:11434`

**Endpoints Used:**
- `GET /api/tags` - List available models
- `POST /api/chat` - Chat completion

### Models Used

#### DeepSeek Coder V2 (Detection)

- **Purpose:** Find vulnerabilities in code
- **Size:** ~8.9 GB
- **Strengths:** Excellent code understanding, follows instructions well
- **Temperature:** 0.1 (low for consistent output)

#### Llama 3.1 8B (Explanation)

- **Purpose:** Generate human-readable explanations
- **Size:** ~4.9 GB
- **Strengths:** Natural language, clear explanations
- **Temperature:** 0.1 (low for consistent output)

### Prompt Engineering

#### Detection Prompt Structure
SYSTEM: You are an expert smart contract security auditor...
Focus on: reentrancy, overflow, access control...
Respond with JSON only.

USER:   Analyze this contract:
[CONTRACT CODE]
Return JSON format:
    {
      "vulnerabilities": [...],
      "summary": "...",
      "total_issues": N
    }
    #### Explanation Prompt Structure
    SYSTEM: You are a security expert who explains vulnerabilities...

USER:   Explain this vulnerability:
Type: [TYPE]
Severity: [SEVERITY]
Code: [CODE]
Return JSON format:
    {
      "description": "...",
      "impact": "...",
      "recommendation": "...",
      "fixed_code": "..."
    }
    ---

## 📁 File Structure
Smart-Contract-Scanner/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── init.py
│   │   │   │   ├── analyze.py      # Analysis endpoints
│   │   │   │   ├── contracts.py    # Contract CRUD
│   │   │   │   ├── health.py       # Health checks
│   │   │   │   ├── reports.py      # Report generation
│   │   │   │   └── stats.py        # Statistics
│   │   │   ├── init.py
│   │   │   └── deps.py             # Dependencies
│   │   ├── core/
│   │   │   ├── init.py
│   │   │   ├── config.py           # App configuration
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── logging.py          # Logging setup
│   │   ├── db/
│   │   │   ├── init.py
│   │   │   ├── database.py         # DB connection
│   │   │   ├── models.py           # SQLAlchemy models
│   │   │   └── crud.py             # CRUD operations
│   │   ├── prompts/
│   │   │   ├── init.py
│   │   │   ├── detection.py        # Detection prompts
│   │   │   └── explanation.py      # Explanation prompts
│   │   ├── schemas/
│   │   │   ├── init.py
│   │   │   ├── analysis.py         # Analysis schemas
│   │   │   ├── common.py           # Common schemas
│   │   │   ├── contract.py         # Contract schemas
│   │   │   └── vulnerability.py    # Vulnerability schemas
│   │   ├── services/
│   │   │   ├── init.py
│   │   │   ├── ai_analyzer.py      # Ollama integration
│   │   │   └── analysis_orchestrator.py  # Main logic
│   │   └── init.py
│   ├── tests/
│   │   └── ...                     # Test files
│   ├── venv/                       # Virtual environment
│   ├── main.py                     # App entry point
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile
├── frontend/                       # React frontend (to be built)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
├── contracts/                      # Foundry project
│   ├── src/
│   │   └── examples/              # Vulnerable examples
│   ├── test/
│   └── foundry.toml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
├── .github/
│   └── workflows/                 # CI/CD pipelines
├── IMPLEMENTATION_PLAN.md         # This file
├── README.md
└── docker-compose.yml
---

## 📅 Development Phases

### Phase 1: Backend Foundation ✅

**Duration:** Week 1-2

**Tasks:**
- [x] Project structure setup
- [x] Database models
- [x] API schemas
- [x] Basic API routes
- [x] FastAPI configuration
- [x] Health check endpoints

**Deliverables:**
- Working API server
- Database schema
- API documentation at /docs

---

### Phase 2: AI Integration ✅

**Duration:** Week 2-3

**Tasks:**
- [x] Ollama setup
- [x] Model download (DeepSeek, Llama)
- [x] Detection prompts
- [x] Explanation prompts
- [x] AI service class
- [x] Analysis orchestrator
- [ ] Error handling refinement

**Deliverables:**
- Working vulnerability detection
- AI-generated explanations
- Fix recommendations

---

### Phase 3: Frontend Development 🔄

**Duration:** Week 3-5

**Tasks:**
- [ ] React project setup
- [ ] Component library (UI)
- [ ] Upload page
- [ ] Analysis results page
- [ ] History page
- [ ] Report viewer
- [ ] Responsive design

**Deliverables:**
- Complete web interface
- User-friendly experience
- Mobile-responsive design

---

### Phase 4: Advanced Features 📋

**Duration:** Week 5-6

**Tasks:**
- [ ] Address-based analysis (Alchemy)
- [ ] PDF report generation
- [ ] Foundry verification
- [ ] Rate limiting
- [ ] Caching

**Deliverables:**
- Blockchain integration
- Professional reports
- Attack verification

---

### Phase 5: Testing & Polish 📋

**Duration:** Week 6-7

**Tasks:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

**Deliverables:**
- Test coverage > 80%
- Performance benchmarks
- Complete documentation

---

### Phase 6: Deployment 📋

**Duration:** Week 7-8

**Tasks:**
- [ ] Docker configuration
- [ ] CI/CD pipeline
- [ ] Cloud deployment
- [ ] Domain setup
- [ ] SSL certificate
- [ ] Monitoring setup

**Deliverables:**
- Live production URL
- Automated deployments
- Monitoring dashboard

---

## 🚀 Deployment Strategy

### Local Development

```bash
# Backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Frontend (when ready)
cd frontend
npm run dev
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
  
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
  
  ollama:
    image: ollama/ollama
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"

volumes:
  ollama_data:
  Cloud Options
Platform	Pros	Cons
Railway	Easy, free tier	Limited GPU
Render	Simple, free tier	Cold starts
DigitalOcean	Affordable	Manual setup
AWS EC2	Scalable	Complex
GCP Cloud Run	Serverless	GPU expensive
Recommended: Start with Railway or Render for simplicity.

Note: Ollama requires GPU or good CPU for reasonable performance.

🔒 Security Considerations
Input Validation
All inputs validated via Pydantic schemas
Contract code size limits
Solidity syntax verification
Address format validation
API Security
CORS configured for specific origins
Rate limiting per IP (planned)
Request size limits
Data Security
No sensitive data stored
Contract code is user-provided
SQLite file permissions
Environment variables for secrets
AI Safety
Local AI (no data sent to cloud)
Model outputs validated
JSON parsing with fallbacks
🔮 Future Enhancements
Short Term (1-3 months)
 User authentication
 Save favorite contracts
 Compare analyses
 Export to multiple formats
 Email reports
Medium Term (3-6 months)
 Multi-file contract support
 Import verification
 Custom vulnerability rules
 Team collaboration
 API keys for integration
Long Term (6-12 months)
 Real-time monitoring
 Automated fix PRs
 IDE plugins (VS Code)
 GitHub integration
 Slither/Mythril integration
 Custom AI model fine-tuning
📊 Success Metrics
Metric	Target	Current
API Response Time	< 60s	~45s
Detection Accuracy	> 85%	TBD
False Positive Rate	< 15%	TBD
Uptime	99.9%	N/A
Test Coverage	> 80%	0%
📚 Resources & References
Solidity Security
SWC Registry - Smart Contract Weakness Classification
Consensys Best Practices
OpenZeppelin Docs
Tools
FastAPI Docs
Ollama Docs
Foundry Book
Learning
Damn Vulnerable DeFi
Ethernaut
👥 Contributing
Fork the repository
Create a feature branch
Make your changes
Run tests
Submit a pull request
📄 License
MIT License - See LICENSE file

📞 Contact
GitHub: KartikJoshi23
Project: Smart-Contract-Scanner
Last Updated: February 2025
▲▲▲ END - STOP COPYING HERE ▲▲▲

---

Press `Ctrl + S` to save.

---

**Done?**

Say **"Done"** and also tell me what happened with the Ollama model test!
