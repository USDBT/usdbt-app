import { Router, type Request, type Response } from 'express'
import { createPublicClient, http, parseAbi, isAddress, formatUnits, type Address } from 'viem'
import { isSimulatedAddress, simulateConfig } from '../lib/simulate'
import { ROBINHOOD_CHAIN_ID, ROBINHOOD_USDG_ADDRESS } from '../lib/relay'

export const balancesRouter = Router()

const ROBINHOOD_RPC_URL = process.env.ROBINHOOD_RPC_URL ?? 'https://rpc.mainnet.chain.robinhood.com'
const USDG_ADDRESS = ROBINHOOD_USDG_ADDRESS as Address

const robinhoodClient = createPublicClient({ transport: http(ROBINHOOD_RPC_URL) })
const ERC20_ABI = parseAbi(['function balanceOf(address) view returns (uint256)'])

export async function getBalances(req: Request, res: Response) {
  const addr = req.params.address
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })

  if (isSimulatedAddress(addr)) {
    return res.json({
      usdg: simulateConfig.balance.usdc,
      eth: '0.0000',
      chainId: ROBINHOOD_CHAIN_ID,
      simulated: true,
    })
  }

  try {
    const [usdgRaw, ethRaw] = await Promise.all([
      robinhoodClient.readContract({
        address: USDG_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [addr as Address],
      }),
      robinhoodClient.getBalance({ address: addr as Address }),
    ])

    res.json({
      usdg: formatUnits(usdgRaw, 6),
      eth: formatUnits(ethRaw, 18),
      chainId: ROBINHOOD_CHAIN_ID,
    })
  } catch (err) {
    console.error('[balances] error:', err)
    res.status(500).json({ error: 'failed to fetch balances' })
  }
}

balancesRouter.get('/:address', getBalances)
