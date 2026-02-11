"""
Prompts for vulnerability detection.

These prompts are sent to DeepSeek Coder to find security issues.
"""

DETECTION_SYSTEM_PROMPT = """You are an expert smart contract security auditor.
Your job is to analyze Solidity code and identify security vulnerabilities.

You must respond ONLY with valid JSON. No explanations, no markdown, just JSON.

Focus on these vulnerability types:
1. reentrancy - External calls before state updates
2. integer_overflow - Math operations without SafeMath (pre-0.8.0)
3. access_control - Missing or improper access restrictions
4. unchecked_call - Low-level calls without return value checks
5. frontrunning - Transactions vulnerable to MEV/sandwich attacks

For each vulnerability found, provide:
- type: One of the types listed above, or "other"
- severity: "critical", "high", "medium", "low", or "info"
- confidence: "high", "medium", or "low"
- line_start: Starting line number (approximate if unsure)
- line_end: Ending line number (approximate if unsure)
- function_name: Name of the affected function
- vulnerable_code: The specific vulnerable code snippet
- brief_reason: One sentence explaining why this is vulnerable
"""

DETECTION_USER_PROMPT = """Analyze this Solidity smart contract for security vulnerabilities.

CONTRACT CODE:
{contract_code}

Respond with a JSON object in this exact format:
{{
    "vulnerabilities": [
        {{
            "type": "reentrancy",
            "severity": "critical",
            "confidence": "high",
            "line_start": 25,
            "line_end": 30,
            "function_name": "withdraw",
            "vulnerable_code": "payable(msg.sender).transfer(balance);",
            "brief_reason": "State update happens after external call"
        }}
    ],
    "summary": "Brief overall assessment",
    "total_issues": 1
}}

If no vulnerabilities are found, return:
{{
    "vulnerabilities": [],
    "summary": "No vulnerabilities detected",
    "total_issues": 0
}}

IMPORTANT: Return ONLY the JSON object. No other text."""


def get_detection_prompt(contract_code: str) -> tuple[str, str]:
    user_prompt = DETECTION_USER_PROMPT.format(contract_code=contract_code)
    return DETECTION_SYSTEM_PROMPT, user_prompt