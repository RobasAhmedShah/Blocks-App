/**
 * Etherscan multi-chain API for ERC-20 token balance.
 * Uses chainid for Polygon Amoy (80002), Polygon (137), Ethereum (1), etc.
 */
const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';
const ETHERSCAN_API_KEY = process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY || 'JCQDJ4XB2EA2KDFRN7J8PZJPHXHAZY4M8X';

export const POLYGON_AMOY_CHAIN_ID = 80002;

export interface TokenBalanceResult {
  rawBalance: string; // wei/smallest unit
  balance: number;   // human-readable (raw / 10^decimals)
  decimals: number;
}

/**
 * Get ERC-20 token balance for a wallet address.
 * @param contractAddress ERC-20 token contract address (e.g. from property_tokens.token_address)
 * @param walletAddress User's connected wallet address
 * @param chainId Chain to query, e.g. 80002 for Polygon Amoy, 137 for Polygon, 1 for Ethereum
 * @param decimals Token decimals (default 18); used to format balance
 */
export async function getTokenBalance(
  contractAddress: string,
  walletAddress: string,
  chainId: number = POLYGON_AMOY_CHAIN_ID,
  decimals: number = 18,
): Promise<TokenBalanceResult> {
  const params = new URLSearchParams({
    module: 'account',
    action: 'tokenbalance',
    contractaddress: contractAddress,
    address: walletAddress,
    tag: 'latest',
    chainid: String(chainId),
    apikey: ETHERSCAN_API_KEY,
  });
  const url = `${ETHERSCAN_BASE}?${params.toString()}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== '1' && data.message !== 'OK') {
    const errMsg = data.result || data.message || 'Unknown error';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }

  const rawBalance = String(data.result ?? '0');
  const rawBig = BigInt(rawBalance);
  const divisor = decimals === 0 ? BigInt(1) : BigInt(10 ** decimals);
  const whole = Number(rawBig / divisor);
  const frac = decimals === 0 ? 0 : Number(rawBig % divisor) / Number(divisor);
  const balance = whole + frac;

  return { rawBalance, balance, decimals };
}
