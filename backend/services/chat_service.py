"""
Chat Service — AI-powered Solidity security chatbot using Gemini.

Provides context-aware chat that understands the current contract
and its vulnerabilities. Supports streaming responses via SSE.
Lazy-initialized to allow the backend to start even without an API key.
Uses the new `google-genai` SDK (replaces deprecated `google-generativeai`).
"""

import json
from google import genai
from google.genai import types
from services.gemini_service import GEMINI_API_KEY


SYSTEM_PROMPT = """You are a Solidity smart contract security expert chatbot. 
You help developers understand vulnerabilities, write secure code, and fix issues.

Guidelines:
- Be concise but thorough
- Use Solidity code examples when helpful
- Reference specific vulnerability patterns (reentrancy, access control, etc.)
- When suggesting fixes, explain WHY the fix works
- If unsure, say so rather than guessing
- Format responses with Markdown: use **bold**, `code`, and ```solidity code blocks```
"""

MAX_CONTEXT_MESSAGES = 20  # Keep last N messages to stay within token limits
MAX_CONTRACT_CHARS = 12000  # Truncate very long contracts


class ChatService:
    def __init__(self):
        self._client = None
        self._configured = False

    def _ensure_configured(self):
        """Lazy-configure Gemini on first use."""
        if self._configured:
            return
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set. Add it to backend/.env")
        self._client = genai.Client(api_key=GEMINI_API_KEY)
        self._configured = True

    def _build_context(self, contract_code: str = None, vulnerabilities: list = None) -> str:
        """Build context string from contract and vulnerability data."""
        context_parts = []
        
        if contract_code:
            truncated = contract_code[:MAX_CONTRACT_CHARS]
            if len(contract_code) > MAX_CONTRACT_CHARS:
                truncated += "\n// ... (truncated)"
            context_parts.append(f"## Contract Source Code\n```solidity\n{truncated}\n```")
        
        if vulnerabilities:
            vuln_summary = []
            for v in vulnerabilities:
                vuln_summary.append(
                    f"- **{v.get('title', 'Unknown')}** [{v.get('severity', 'medium').upper()}]: "
                    f"{v.get('description', 'No description')}"
                )
            context_parts.append(f"## Vulnerabilities Found\n" + "\n".join(vuln_summary))
        
        return "\n\n".join(context_parts)

    def _build_messages(
        self, 
        user_message: str, 
        contract_code: str = None, 
        vulnerabilities: list = None,
        history: list = None
    ) -> tuple:
        """Build the message list for Gemini, including context and history."""
        contents = []
        
        # Build system context
        context = self._build_context(contract_code, vulnerabilities)
        system_text = SYSTEM_PROMPT
        if context:
            system_text += f"\n\nHere is the context for this conversation:\n\n{context}"
        
        # Add conversation history (truncated to last N messages)
        if history:
            recent = history[-MAX_CONTEXT_MESSAGES:]
            for msg in recent:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
        
        # Add current user message
        contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))
        
        return system_text, contents

    async def chat_stream(
        self,
        user_message: str,
        contract_code: str = None,
        vulnerabilities: list = None,
        history: list = None
    ):
        """Stream chat response from Gemini. Yields SSE-formatted chunks."""
        self._ensure_configured()
        system_text, contents = self._build_messages(
            user_message, contract_code, vulnerabilities, history
        )
        
        try:
            response = self._client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_text,
                    temperature=0.3,
                    max_output_tokens=4096,
                ),
            )
            
            for chunk in response:
                if chunk.text:
                    data = json.dumps({"type": "chunk", "content": chunk.text})
                    yield f"data: {data}\n\n"
            
            # Send done signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            error_data = json.dumps({"type": "error", "content": str(e)})
            yield f"data: {error_data}\n\n"

    async def chat_single(
        self,
        user_message: str,
        contract_code: str = None,
        vulnerabilities: list = None,
        history: list = None
    ) -> str:
        """Non-streaming chat for simple responses."""
        self._ensure_configured()
        system_text, contents = self._build_messages(
            user_message, contract_code, vulnerabilities, history
        )
        
        try:
            response = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_text,
                    temperature=0.3,
                    max_output_tokens=4096,
                ),
            )
            return response.text
        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}"


# Singleton — safe to import, won't crash if API key is missing
chat_service = ChatService()
