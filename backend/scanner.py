"""
Contract Scanner — AI Analysis Orchestrator.

Delegates smart contract analysis to the Gemini AI service.
"""

from services.gemini_service import gemini_service


class ContractScanner:
    """Orchestrates smart contract vulnerability analysis using Gemini AI."""

    def __init__(self):
        self.ai_provider = "gemini"

    async def analyze(self, source_code: str) -> dict:
        """Analyze smart contract using Gemini AI."""
        try:
            result = await gemini_service.analyze_contract(source_code)
            return result
        except Exception as e:
            print(f"Analysis error: {e}")
            raise Exception(f"Analysis failed: {str(e)}")

    async def check_ai_connection(self) -> bool:
        """Check if the Gemini AI service is available."""
        try:
            return await gemini_service.check_connection()
        except Exception:
            return False