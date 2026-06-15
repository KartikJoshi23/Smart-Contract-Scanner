"""
Gemini AI Service — Smart Contract Analysis.

Lazy-initialized to allow the backend to start even without an API key.
Uses the new `google-genai` SDK (replaces deprecated `google-generativeai`).
"""

import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class GeminiService:
    """Orchestrates smart contract vulnerability analysis using Gemini AI."""

    def __init__(self):
        self._client = None
        self._configured = False

    def _ensure_configured(self):
        """Lazy-configure the Gemini client on first use."""
        if self._configured:
            return
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY not set. Add it to backend/.env"
            )
        self._client = genai.Client(api_key=GEMINI_API_KEY)
        self._configured = True

    async def analyze_contract(self, source_code: str) -> dict:
        self._ensure_configured()
        prompt = self._build_prompt(source_code)

        try:
            response = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=8192,
                ),
            )

            response_text = response.text.strip()
            response_text = self._clean_response(response_text)
            result = json.loads(response_text)

            return {
                "risk_score": result.get("risk_score", 0),
                "summary": result.get("summary", "Analysis complete."),
                "vulnerabilities": result.get("vulnerabilities", [])
            }

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return {
                "risk_score": 0,
                "summary": "Failed to parse analysis results.",
                "vulnerabilities": []
            }
        except Exception as e:
            print(f"Gemini API error: {e}")
            raise Exception(f"Gemini analysis failed: {str(e)}")

    def _build_prompt(self, source_code: str) -> str:
        return f'''You are a smart contract security expert. Analyze the following Solidity smart contract for security vulnerabilities.

For each vulnerability found, provide:
1. title: Short name of the vulnerability
2. severity: One of "critical", "high", "medium", "low", "info"
3. category: Type like "reentrancy", "overflow", "access-control", "gas", "logic"
4. description: Clear explanation of the vulnerability
5. impact: What could happen if exploited
6. recommendation: How to fix it
7. vulnerable_code: The specific code snippet that is vulnerable
8. fixed_code: The corrected code snippet
9. line_start: Approximate starting line number
10. line_end: Approximate ending line number
11. function_name: Name of the affected function
12. confidence: One of "high", "medium", "low"

Also provide:
- risk_score: Overall risk score from 0-100
- summary: Brief summary of the contract security status

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{{"risk_score": 0, "summary": "string", "vulnerabilities": []}}

CONTRACT CODE:
{source_code}

Respond with JSON only:'''

    def _clean_response(self, text: str) -> str:
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]

        if text.endswith("```"):
            text = text[:-3]

        return text.strip()

    async def check_connection(self) -> bool:
        try:
            self._ensure_configured()
            response = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents="Say OK",
            )
            return response.text is not None
        except Exception:
            return False


# Singleton — safe to import, won't crash if API key is missing
gemini_service = GeminiService()