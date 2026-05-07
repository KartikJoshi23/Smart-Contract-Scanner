.PHONY: help dev dev-backend dev-frontend install docker docker-dev clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend: ## Run backend dev server
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend: ## Run frontend dev server
	cd frontend && npm run dev

dev: ## Run both backend and frontend (requires 2 terminals)
	@echo "Run in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

docker: ## Run production Docker setup
	docker-compose up --build

docker-dev: ## Run development Docker setup
	docker-compose -f docker-compose.dev.yml up --build

clean: ## Clean build artifacts and caches
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/dist frontend/node_modules/.cache
	rm -f backend/*.db
