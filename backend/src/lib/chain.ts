import { createPublicClient, http, parseAbi, type Address } from 'viem'
import { base } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? 'https://mainnet.base.org'),
})

const TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

export async function findIncomingTransfer(opts: {
  tokenAddress: Address
  from: Address
  to: Address
  expectedAmountHuman: number
  decimals: number
  fromBlock: bigint
}): Promise<{ txHash: string; amount: bigint } | null> {
  const { tokenAddress, from, to, expectedAmountHuman, decimals, fromBlock } = opts

  const logs = await publicClient.getLogs({
    address: tokenAddress,
    event: TRANSFER_ABI[0],
    args: { from, to },
    fromBlock,
    toBlock: 'latest',
  })

  const expectedRaw = BigInt(Math.round(expectedAmountHuman * 10 ** decimals))
  const tolerance = BigInt(10 ** (decimals - 2))

  for (const log of logs) {
    const value = log.args.value as bigint
    if (value >= expectedRaw - tolerance && value <= expectedRaw + tolerance) {
      return { txHash: log.transactionHash!, amount: value }
    }
  }

  return null
}

export async function currentBlock(): Promise<bigint> {
  return publicClient.getBlockNumber()
}
