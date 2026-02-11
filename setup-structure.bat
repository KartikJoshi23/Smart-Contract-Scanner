@echo off
echo.
echo ========================================
echo  Smart Contract Scanner - Setup Script
echo ========================================
echo.
echo Creating folder structure...
echo.

REM ============ ROOT FILES ============
echo Creating root files...
type nul > .env.example
type nul > .gitignore
type nul > docker-compose.yml
type nul > docker-compose.dev.yml
type nul > Makefile
type nul > LICENSE

REM ============ DOCS ============
echo Creating docs folder...
mkdir docs
type nul > docs\ARCHITECTURE.md
type nul > docs\API.md
type nul > docs\DEPLOYMENT.md
type nul > docs\CONTRIBUTING.md

REM ============ SCRIPTS ============
echo Creating scripts folder...
mkdir scripts
type nul > scripts\setup.sh
type nul > scripts\pull-models.sh
type nul > scripts\seed-db.sh
type nul > scripts\generate-test-contracts.sh

REM ============ GITHUB ============
echo Creating .github folder...
mkdir .github
mkdir .github\workflows
mkdir .github\ISSUE_TEMPLATE
type nul > .github\workflows\ci.yml
type nul > .github\workflows\deploy.yml
type nul > .github\workflows\security.yml
type nul > .github\ISSUE_TEMPLATE\bug_report.md
type nul > .github\ISSUE_TEMPLATE\feature_request.md
type nul > .github\PULL_REQUEST_TEMPLATE.md

REM ============ BACKEND ============
echo Creating backend folder...
mkdir backend
type nul > backend\Dockerfile
type nul > backend\Dockerfile.dev
type nul > backend\requirements.txt
type nul > backend\main.py
type nul > backend\pytest.ini

REM Backend - App
mkdir backend\app
type nul > backend\app\__init__.py

REM Backend - API
mkdir backend\app\api
mkdir backend\app\api\routes
type nul > backend\app\api\__init__.py
type nul > backend\app\api\deps.py
type nul > backend\app\api\routes\__init__.py
type nul > backend\app\api\routes\analyze.py
type nul > backend\app\api\routes\contracts.py
type nul > backend\app\api\routes\reports.py
type nul > backend\app\api\routes\stats.py
type nul > backend\app\api\routes\health.py

REM Backend - Core
mkdir backend\app\core
type nul > backend\app\core\__init__.py
type nul > backend\app\core\config.py
type nul > backend\app\core\logging.py
type nul > backend\app\core\exceptions.py

REM Backend - Database
mkdir backend\app\db
type nul > backend\app\db\__init__.py
type nul > backend\app\db\database.py
type nul > backend\app\db\models.py
type nul > backend\app\db\crud.py

REM Backend - Schemas
mkdir backend\app\schemas
type nul > backend\app\schemas\__init__.py
type nul > backend\app\schemas\contract.py
type nul > backend\app\schemas\analysis.py
type nul > backend\app\schemas\vulnerability.py
type nul > backend\app\schemas\common.py

REM Backend - Services
mkdir backend\app\services
type nul > backend\app\services\__init__.py
type nul > backend\app\services\analysis_orchestrator.py
type nul > backend\app\services\ai_analyzer.py
type nul > backend\app\services\foundry_runner.py
type nul > backend\app\services\contract_fetcher.py
type nul > backend\app\services\vulnerability_detector.py
type nul > backend\app\services\report_builder.py
type nul > backend\app\services\pdf_generator.py

REM Backend - Prompts
mkdir backend\app\prompts
type nul > backend\app\prompts\__init__.py
type nul > backend\app\prompts\detection.py
type nul > backend\app\prompts\explanation.py
type nul > backend\app\prompts\fix_generation.py
type nul > backend\app\prompts\attack_test.py

REM Backend - Utils
mkdir backend\app\utils
type nul > backend\app\utils\__init__.py
type nul > backend\app\utils\solidity_parser.py
type nul > backend\app\utils\json_parser.py
type nul > backend\app\utils\validators.py

REM Backend - Tests
mkdir backend\tests
mkdir backend\tests\test_api
mkdir backend\tests\test_services
mkdir backend\tests\test_db
type nul > backend\tests\__init__.py
type nul > backend\tests\conftest.py
type nul > backend\tests\test_api\test_analyze.py
type nul > backend\tests\test_api\test_contracts.py
type nul > backend\tests\test_api\test_health.py
type nul > backend\tests\test_services\test_ai_analyzer.py
type nul > backend\tests\test_services\test_foundry_runner.py
type nul > backend\tests\test_services\test_vulnerability_detector.py
type nul > backend\tests\test_db\test_crud.py

REM ============ FRONTEND ============
echo Creating frontend folder...
mkdir frontend
mkdir frontend\public
mkdir frontend\src
mkdir frontend\src\components
mkdir frontend\src\components\ui
mkdir frontend\src\components\layout
mkdir frontend\src\components\analysis
mkdir frontend\src\components\charts
mkdir frontend\src\components\reports
mkdir frontend\src\components\common
mkdir frontend\src\pages
mkdir frontend\src\hooks
mkdir frontend\src\stores
mkdir frontend\src\services
mkdir frontend\src\lib
mkdir frontend\src\types
mkdir frontend\src\styles

type nul > frontend\Dockerfile
type nul > frontend\Dockerfile.dev
type nul > frontend\nginx.conf
type nul > frontend\package.json
type nul > frontend\tsconfig.json
type nul > frontend\vite.config.ts
type nul > frontend\tailwind.config.js
type nul > frontend\postcss.config.js
type nul > frontend\vercel.json
type nul > frontend\index.html
type nul > frontend\public\robots.txt
type nul > frontend\src\main.tsx
type nul > frontend\src\App.tsx
type nul > frontend\src\vite-env.d.ts
type nul > frontend\src\styles\globals.css

REM ============ CONTRACTS (Foundry) ============
echo Creating contracts folder...
mkdir contracts
mkdir contracts\src
mkdir contracts\src\examples
mkdir contracts\test
mkdir contracts\test\helpers
mkdir contracts\script
mkdir contracts\lib

type nul > contracts\foundry.toml
type nul > contracts\remappings.txt
type nul > contracts\src\examples\VulnerableBank.sol
type nul > contracts\src\examples\InsecureToken.sol
type nul > contracts\src\examples\UnsafeAuction.sol
type nul > contracts\test\VulnerableBank.t.sol
type nul > contracts\test\helpers\TestHelper.sol
type nul > contracts\script\Deploy.s.sol

echo.
echo ========================================
echo  Folder structure created successfully!
echo ========================================
echo.
echo Next steps:
echo   1. Close this window
echo   2. Go back to VS Code
echo   3. You will see all folders in the sidebar
echo.
pause   