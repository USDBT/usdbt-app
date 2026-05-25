import { Client, Databases, DatabasesIndexType } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT ?? 'https://sfo.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID ?? '6a1458d000006e1763fc')
  .setKey(process.env.APPWRITE_API_KEY!)

const db = new Databases(client)
const DB_ID = process.env.APPWRITE_DATABASE_ID!
const ORDERS = 'orders'

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function run() {
  try {
    await db.getCollection(DB_ID, ORDERS)
    console.log('orders collection already exists — skipping')
    return
  } catch {
    // doesn't exist yet, create it
  }

  await db.createCollection(DB_ID, ORDERS, 'orders', [])
  console.log('created orders collection')

  const strAttrs: [string, number, boolean][] = [
    ['walletAddress',    100, true ],
    ['email',            255, true ],
    ['cardType',          20, true ],
    ['brandId',           50, false],
    ['brandName',        100, false],
    ['paymentCurrency',   10, true ],
    ['txHash',           100, false],
    ['status',            20, true ],
    ['reloadlyOrderId',  100, false],
    ['failureReason',    500, false],
  ]

  for (const [key, size, required] of strAttrs) {
    await db.createStringAttribute(DB_ID, ORDERS, key, size, required)
  }

  await db.createFloatAttribute(DB_ID, ORDERS, 'faceValue',      true)
  await db.createFloatAttribute(DB_ID, ORDERS, 'paymentAmount',  true)
  await db.createFloatAttribute(DB_ID, ORDERS, 'feeRate',        true)
  await db.createDatetimeAttribute(DB_ID, ORDERS, 'expiresAt',   true)

  console.log('created attributes — waiting for Appwrite to process...')
  await sleep(6000)

  await db.createIndex(DB_ID, ORDERS, 'idx_wallet',        DatabasesIndexType.Key, ['walletAddress'])
  await db.createIndex(DB_ID, ORDERS, 'idx_status',        DatabasesIndexType.Key, ['status'])
  await db.createIndex(DB_ID, ORDERS, 'idx_wallet_status', DatabasesIndexType.Key, ['walletAddress', 'status'])

  console.log('created indexes')
  console.log('\n✅ DB setup complete')
}

run().catch((err) => {
  console.error('setup failed:', err)
  process.exit(1)
})
