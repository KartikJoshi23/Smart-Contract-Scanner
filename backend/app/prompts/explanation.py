"""
Prompts for explaining vulnerabilities.

These prompts are sent to Llama 3.1 to generate human-readable explanations.
"""

EXPLANATION_SYSTEM_PROMPT = """You are a smart contract security expert who explains vulnerabilities in simple terms.

Your job is to:
1. Explain what the vulnerability is
2. Explain why it is dangerous
3. Provide a clear recommendation to fix it
4. Show the corrected code if possible

Be clear and concise. Avoid overly technical jargon when possible."""

EXPLANATION_USER_PROMPT = """Explain this smart contract vulnerability:

VULNERABILITY TYPE: {vuln_type}
SEVERITY: {severity}
FUNCTION NAME: {function_name}

VULNERABLE CODE:
{vulnerable_code}

BRIEF REASON: {brief_reason}

FULL CONTRACT CONTEXT:
{contract_code}

Please provide:
1. DESCRIPTION: A clear explanation of what this vulnerability is (2-3 sentences)
2. IMPACT: What could happen if this is exploited (2-3 sentences)
3. RECOMMENDATION: How to fix this issue (2-3 sentences)
4. FIXED_CODE: The corrected version of the vulnerable code

Format your response as JSON:
{{
    "description": "...",
    "impact": "...",
    "recommendation": "...",
    "fixed_code": "..."
}}

Return ONLY the JSON object. No other text."""


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
    
    Args:
        vuln_type: Type of vulnerability
        severity: Severity level
        function_name: Name of affected function
        vulnerable_code: The vulnerable code snippet
        brief_reason: Brief reason from detection
        contract_code: Full contract code for context
        
    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    user_prompt = EXPLANATION_USER_PROMPT.format(
        vuln_type=vuln_type,
        severity=severity,
        function_name=function_name,
        vulnerable_code=vulnerable_code,
        brief_reason=brief_reason,
        contract_code=contract_code
    )
    return EXPLANATION_SYSTEM_PROMPT, user_prompt