"""
Prompts for explaining vulnerabilities.

These prompts are sent to Llama 3.1 to generate human-readable explanations.
"""

EXPLANATION_SYSTEM_PROMPT = """You are a smart contract security expert.
You explain vulnerabilities in simple, clear terms.
You always respond with valid JSON only. No extra text."""

EXPLANATION_USER_PROMPT = """A vulnerability was found in a smart contract.

VULNERABILITY TYPE: {vuln_type}
SEVERITY: {severity}
FUNCTION: {function_name}
VULNERABLE CODE: {vulnerable_code}
REASON: {brief_reason}

Explain this vulnerability. Return ONLY this JSON format:

{{"description": "What this vulnerability is and why the code is unsafe (2-3 sentences)", "impact": "What bad things could happen if exploited (2-3 sentences)", "recommendation": "How to fix this vulnerability (2-3 sentences)", "fixed_code": "The corrected Solidity code that fixes the issue"}}

For the fixed_code, write the complete corrected function.

Return ONLY the JSON. No other text before or after."""


def get_explanation_prompt(
    vuln_type: str,
    severity: str,
    function_name: str,
    vulnerable_code: str,
    brief_reason: str,
    contract_code: str
) -> tuple[str, str]:
    """
    Get the system and user prompts for vulnerability explanation.
    """
    user_prompt = EXPLANATION_USER_PROMPT.format(
        vuln_type=vuln_type,
        severity=severity,
        function_name=function_name,
        vulnerable_code=vulnerable_code,
        brief_reason=brief_reason
    )
    return EXPLANATION_SYSTEM_PROMPT, user_prompt