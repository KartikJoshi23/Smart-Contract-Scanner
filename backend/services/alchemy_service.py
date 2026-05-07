import os
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY")

# Network configurations with Alchemy URLs
NETWORK_CONFIGS = {
    "ethereum": {
        "alchemy_url": f"https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
        "etherscan_url": "https://api.etherscan.io/api",
        "chain_id": 1
    },
    "polygon": {
        "alchemy_url": f"https://polygon-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
        "etherscan_url": "https://api.polygonscan.com/api",
        "chain_id": 137
    },
    "arbitrum": {
        "alchemy_url": f"https://arb-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
        "etherscan_url": "https://api.arbiscan.io/api",
        "chain_id": 42161
    },
    "optimism": {
        "alchemy_url": f"https://opt-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
        "etherscan_url": "https://api-optimistic.etherscan.io/api",
        "chain_id": 10
    },
    "base": {
        "alchemy_url": f"https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
        "etherscan_url": "https://api.basescan.org/api",
        "chain_id": 8453
    },
    "bsc": {
        "alchemy_url": None,
        "etherscan_url": "https://api.bscscan.com/api",
        "chain_id": 56
    }
}


class AlchemyService:
    """Service for interacting with Alchemy and fetching contract data."""
    
    def __init__(self):
        self.api_key = ALCHEMY_API_KEY
        if not self.api_key:
            print("Warning: ALCHEMY_API_KEY not set in environment")
    
    async def get_contract_source(self, address: str, network: str = "ethereum") -> Optional[dict]:
        """
        Fetch verified contract source code from block explorer.
        Uses Etherscan-compatible APIs for each network.
        """
        if network not in NETWORK_CONFIGS:
            raise ValueError(f"Unsupported network: {network}")
        
        config = NETWORK_CONFIGS[network]
        etherscan_url = config["etherscan_url"]
        
        params = {
            "module": "contract",
            "action": "getsourcecode",
            "address": address,
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(etherscan_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data["status"] == "1" and data["result"]:
                    result = data["result"][0]
                    
                    if result.get("SourceCode") and result["SourceCode"] != "":
                        source_code = result["SourceCode"]
                        
                        # Handle JSON format (multiple files)
                        if source_code.startswith("{"):
                            try:
                                import json
                                if source_code.startswith("{{"):
                                    source_code = source_code[1:-1]
                                
                                sources = json.loads(source_code)
                                
                                if "sources" in sources:
                                    sources = sources["sources"]
                                
                                combined_source = ""
                                for filename, content in sources.items():
                                    if isinstance(content, dict) and "content" in content:
                                        combined_source += f"// File: {filename}\n"
                                        combined_source += content["content"] + "\n\n"
                                    elif isinstance(content, str):
                                        combined_source += f"// File: {filename}\n"
                                        combined_source += content + "\n\n"
                                
                                source_code = combined_source if combined_source else result["SourceCode"]
                            except json.JSONDecodeError:
                                pass
                        
                        return {
                            "address": address,
                            "network": network,
                            "contract_name": result.get("ContractName", "Unknown"),
                            "source_code": source_code,
                            "compiler_version": result.get("CompilerVersion", ""),
                            "optimization_used": result.get("OptimizationUsed", "0") == "1",
                            "runs": int(result.get("Runs", 200)),
                            "abi": result.get("ABI", ""),
                            "is_verified": True
                        }
                    else:
                        return {
                            "address": address,
                            "network": network,
                            "contract_name": None,
                            "source_code": None,
                            "is_verified": False,
                            "error": "Contract source code not verified"
                        }
                else:
                    return {
                        "address": address,
                        "network": network,
                        "is_verified": False,
                        "error": data.get("message", "Failed to fetch contract")
                    }
                    
        except httpx.TimeoutException:
            return {
                "address": address,
                "network": network,
                "is_verified": False,
                "error": "Request timed out"
            }
        except Exception as e:
            return {
                "address": address,
                "network": network,
                "is_verified": False,
                "error": str(e)
            }
    
    async def is_contract(self, address: str, network: str = "ethereum") -> bool:
        """Check if an address is a contract using Alchemy."""
        if network not in NETWORK_CONFIGS:
            return False
        
        config = NETWORK_CONFIGS[network]
        alchemy_url = config["alchemy_url"]
        
        if not alchemy_url:
            return True
        
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_getCode",
            "params": [address, "latest"],
            "id": 1
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(alchemy_url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                code = data.get("result", "0x")
                return code != "0x" and len(code) > 2
        except Exception:
            return False
    
    async def get_contract_info(self, address: str, network: str = "ethereum") -> dict:
        """Get basic contract information using Alchemy."""
        if network not in NETWORK_CONFIGS:
            raise ValueError(f"Unsupported network: {network}")
        
        config = NETWORK_CONFIGS[network]
        alchemy_url = config["alchemy_url"]
        
        if not alchemy_url:
            return {"address": address, "network": network, "balance": None}
        
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_getBalance",
            "params": [address, "latest"],
            "id": 1
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(alchemy_url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                balance_wei = int(data.get("result", "0x0"), 16)
                balance_eth = balance_wei / 10**18
                
                return {
                    "address": address,
                    "network": network,
                    "balance_wei": balance_wei,
                    "balance_eth": round(balance_eth, 6)
                }
        except Exception as e:
            return {
                "address": address,
                "network": network,
                "error": str(e)
            }


# Singleton instance
alchemy_service = AlchemyService()