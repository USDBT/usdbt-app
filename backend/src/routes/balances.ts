import { Router } from 'express'
import { publicClient } from '../lib/chain'
import { parseAbi, isAddress, type Address } from 'viem'

export const balancesRouter = Router()

const ERC20_ABI = parseAbi(['function balanceOf(address) view returns (uint256)'])
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address

balancesRouter.get('/:address', async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })

  const USDBT_ADDRESS = process.env.USDTB_TOKEN_ADDRESS as Address | undefined

  try {
    const [usdcRaw, usdbtRaw] = await Promise.all([
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [addr as Address],
      }),
      USDBT_ADDRESS
        ? publicClient.readContract({
            address: USDBT_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [addr as Address],
          })
        : Promise.resolve(0n),
    ])

    res.json({
      usdc: (Number(usdcRaw) / 1e6).toFixed(2),
      usdbt: (Number(usdbtRaw) / 1e18).toFixed(4),
    })
  } catch (err) {
    console.error('[balances] error:', err)
    res.status(500).json({ error: 'failed to fetch balances' })
  }
})
