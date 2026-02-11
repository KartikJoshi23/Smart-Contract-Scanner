"""
AI Analyzer Service.

This service communicates with Ollama to analyze smart contracts.
"""

import httpx
import json
import re
from typing import Optional
from app.core.config import settings
from app.core.exceptions import AIServiceError
from app.prompts import get_detection_prompt, get_explanation_prompt


class AIAnalyzer:
    """
    Handles all AI-related operations using Ollama.
    """
    
    def __init__(self):
        self.ollama_host = settings.ollama_host
        self.detection_model = settings.detection_model
        self.explanation_model = settings.explanation_model
        self.timeout = 300.0
    
    async def check_connection(self) -> bool:
        """
        Check if Ollama is running and accessible.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.ollama_host}/api/tags",
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception:
            return False
    
    async def _call_ollama(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str
    ) -> str:
        """
        Make a request to Ollama API using generate endpoint.
        """
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.ollama_host}/api/generate",
                    json={
                        "model": model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": 1024
                        }
                    },
                    timeout=self.timeout
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    raise AIServiceError(
                        f"Ollama returned status {response.status_code}: {error_text}"
                    )
                
                result = response.json()
                return result.get("response", "")
                
        except httpx.TimeoutException:
            raise AIServiceError("AI request timed out. The model may be loading.")
        except httpx.ConnectError:
            raise AIServiceError("Cannot connect to Ollama. Is it running?")
        except AIServiceError:
            raise
        except Exception as e:
            raise AIServiceError(f"AI request failed: {str(e)}")
    
    def _clean_json_string(self, s: str) -> str:
        """
        Clean a string for JSON parsing.
        Remove control characters and fix common issues.
        """
        s = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', s)
        s = s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        s = re.sub(r' +', ' ', s)
        return s
    
    def _parse_json_response(self, response: str, debug_label: str = "") -> dict:
        """
        Parse JSON from AI response.
        """
        print(f"\n{'='*50}")
        print(f"DEBUG [{debug_label}] Raw AI Response:")
        print(response[:500] if len(response) > 500 else response)
        print(f"{'='*50}\n")
        
        response = response.strip()
        
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        response = response.strip()
        
        try:
            parsed = json.loads(response)
            print(f"DEBUG [{debug_label}] Parsed successfully!")
            return parsed
        except json.JSONDecodeError as e:
            print(f"DEBUG [{debug_label}] JSON parse error: {e}")
            
            cleaned = self._clean_json_string(response)
            
            try:
                parsed = json.loads(cleaned)
                print(f"DEBUG [{debug_label}] Parsed after cleaning!")
                return parsed
            except json.JSONDecodeError:
                pass
            
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    parsed = json.loads(cleaned[start:end])
                    print(f"DEBUG [{debug_label}] Parsed after extraction!")
                    return parsed
                except json.JSONDecodeError as e2:
                    print(f"DEBUG [{debug_label}] Second parse error: {e2}")
            
            result = self._extract_fields_manually(response)
            if result:
                print(f"DEBUG [{debug_label}] Extracted manually!")
                return result
            
            return {"error": "Failed to parse AI response", "raw": response[:200]}
    
    def _extract_fields_manually(self, response: str) -> dict:
        """
        Try to extract fields manually using regex if JSON parsing fails.
        """
        result = {}
        
        desc_match = re.search(r'"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', response)
        if desc_match:
            result["description"] = desc_match.group(1).replace('\\"', '"')
        
        impact_match = re.search(r'"impact"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', response)
        if impact_match:
            result["impact"] = impact_match.group(1).replace('\\"', '"')
        
        rec_match = re.search(r'"recommendation"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', response)
        if rec_match:
            result["recommendation"] = rec_match.group(1).replace('\\"', '"')
        
        fix_match = re.search(r'"fixed_code"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', response)
        if fix_match:
            result["fixed_code"] = fix_match.group(1).replace('\\"', '"').replace('\\n', '\n')
        
        if result:
            return result
        return None
    
    async def detect_vulnerabilities(self, contract_code: str) -> dict:
        """
        Analyze contract code for vulnerabilities.
        """
        system_prompt, user_prompt = get_detection_prompt(contract_code)
        
        response = await self._call_ollama(
            model=self.detection_model,
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        return self._parse_json_response(response, "DETECTION")
    
    async def explain_vulnerability(
        self,
        vuln_type: str,
        severity: str,
        function_name: str,
        vulnerable_code: str,
        brief_reason: str,
        contract_code: str
    ) -> dict:
        """
        Get detailed explanation for a vulnerability.
        """
        system_prompt, user_prompt = get_explanation_prompt(
            vuln_type=vuln_type,
            severity=severity,
            function_name=function_name or "unknown",
            vulnerable_code=vulnerable_code or "",
            brief_reason=brief_reason,
            contract_code=contract_code
        )
        
        response = await self._call_ollama(
            model=self.explanation_model,
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        return self._parse_json_response(response, "EXPLANATION")


ai_analyzer = AIAnalyzer()