from typing import Optional, Any


class ScannerException(Exception):
    """
    Base exception for our application.
    All custom exceptions inherit from this.
    """
    
    def __init__(self, message: str, details: Optional[Any] = None):
        self.message = message
        self.details = details
        super().__init__(message)


class ValidationError(ScannerException):
    """
    Raised when user input is invalid.
    
    Examples:
    - Invalid Solidity code
    - Contract address wrong format
    - File too large
    """
    pass


class AnalysisError(ScannerException):
    """
    Raised when analysis process fails.
    
    Examples:
    - AI couldn't analyze the code
    - Unexpected error during scan
    """
    pass


class AIServiceError(ScannerException):
    """
    Raised when Ollama (AI) is unavailable or fails.
    
    Examples:
    - Ollama not running
    - Model not downloaded
    - AI request timeout
    """
    pass


class FoundryError(ScannerException):
    """
    Raised when Foundry operations fail.
    
    Examples:
    - Forge compilation failed
    - Anvil couldn't start
    - Test execution failed
    """
    pass


class BlockchainError(ScannerException):
    """
    Raised when blockchain operations fail.
    
    Examples:
    - Alchemy API error
    - Network unreachable
    - Invalid response
    """
    pass


class ContractNotFoundError(ScannerException):
    """
    Raised when contract doesn't exist.
    
    Examples:
    - Address has no contract
    - Contract ID not in database
    """
    pass


class RateLimitError(ScannerException):
    """
    Raised when user exceeds rate limit.
    
    Examples:
    - Too many requests per minute
    """
    pass