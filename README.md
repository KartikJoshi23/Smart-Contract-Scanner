# 🛡️ Smart Contract Security Scanner

An AI-powered smart contract vulnerability detection tool built with **FastAPI**, **React**, and **Google Gemini 2.5 Flash**. Analyze Solidity smart contracts for security vulnerabilities instantly with detailed explanations and fix recommendations.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-4285F4?logo=google)

---

## ✨ Features

- **🤖 AI-Powered Analysis** — Uses Google Gemini 2.5 Flash for vulnerability detection
- **📝 Code Editor** — Monaco Editor integration for Solidity code
- **🔗 Fetch by Address** — Fetch verified contracts from 6 blockchain networks
- **📊 Risk Scoring** — 0-100 risk score with severity breakdown
- **🔧 Fix Suggestions** — AI-generated corrected code snippets
- **📈 Statistics Dashboard** — System health and analysis metrics
- **📜 Analysis History** — Browse and search past scans
- **🌐 Multi-Network** — Ethereum, Polygon, BSC, Arbitrum, Optimism, Base

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, SQLite, Pydantic |
| **AI** | Google Gemini 2.5 Flash |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| **Blockchain** | Alchemy API, Etherscan APIs |
| **DevOps** | Docker, GitHub Actions |

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Gemini API Key](https://aistudio.google.com/apikey)
- [Alchemy API Key](https://dashboard.alchemy.com/)

### 1. Clone & Setup

```bash
git clone https://github.com/KartikJoshi23/Smart-Contract-Scanner.git
cd Smart-Contract-Scanner
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy the example env file
cp ../.env.example .env

# Edit .env and add your API keys
# GEMINI_API_KEY=your_key_here
# ALCHEMY_API_KEY=your_key_here
```

### 4. Start Backend

```bash
uvicorn main:app --reload --port 8000
```

### 5. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

### Docker Setup

```bash
# Production
docker-compose up --build

# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up --build
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/analyze` | Analyze contract source code |
| `POST` | `/api/fetch-contract` | Fetch contract from blockchain |
| `GET` | `/api/contract-info/{network}/{address}` | Get contract info |
| `GET` | `/api/stats` | Scanner statistics |
| `GET` | `/api/history` | Analysis history |

## 🔒 Security

- **Never commit `.env` files** — Use `.env.example` as a template
- All inputs validated via Pydantic schemas
- CORS configured for allowed origins
- Contract address format validation

## 📁 Project Structure

```
Smart-Contract-Scanner/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── scanner.py           # AI analysis orchestrator
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic validation
│   ├── database.py          # DB configuration
│   └── services/
│       ├── gemini_service.py # Gemini AI integration
│       └── alchemy_service.py # Blockchain integration
├── frontend/
│   └── src/
│       ├── pages/           # Scanner, History, Stats
│       ├── components/      # UI components
│       ├── services/api.ts  # API client
│       └── context/         # State management
├── docker-compose.yml       # Production Docker setup
└── IMPLEMENTATION_PLAN.md   # Detailed project docs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Kartik Joshi** — [@KartikJoshi23](https://github.com/KartikJoshi23)
