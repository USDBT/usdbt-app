import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT ?? 'https://sfo.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID ?? '6a1458d000006e1763fc')
  .setKey(process.env.APPWRITE_API_KEY!)

const db = new Databases(client)
const DB_ID = process.env.APPWRITE_DATABASE_ID!
const ORDERS = 'orders'
const USERS = 'users'
const WEBHOOK_EVENTS = process.env.APPWRITE_WEBHOOK_EVENTS_COLLECTION_ID ?? 'webhook_events'

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function ensureCollection(collectionId: string, name: string) {
  try {
    await db.getCollection(DB_ID, collectionId)
    console.log(`${collectionId} collection already exists`)
  } catch {
    await db.createCollection(DB_ID, collectionId, name, [])
    console.log(`created ${collectionId} collection`)
  }
}

async function ensureStringAttribute(
  collectionId: string,
  key: string,
  size: number,
  required: boolean
) {
  try {
    await db.createStringAttribute(DB_ID, collectionId, key, size, required)
    console.log(`created ${collectionId}.${key}`)
  } catch (err: any) {
    if (String(err?.message ?? '').toLowerCase().includes('already exists')) return
    throw err
  }
}

async function ensureFloatAttribute(collectionId: string, key: string, required: boolean) {
  try {
    await db.createFloatAttribute(DB_ID, collectionId, key, required)
    console.log(`created ${collectionId}.${key}`)
  } catch (err: any) {
    if (String(err?.message ?? '').toLowerCase().includes('already exists')) return
    throw err
  }
}

async function ensureDatetimeAttribute(collectionId: string, key: string, required: boolean) {
  try {
    await db.createDatetimeAttribute(DB_ID, collectionId, key, required)
    console.log(`created ${collectionId}.${key}`)
  } catch (err: any) {
    if (String(err?.message ?? '').toLowerCase().includes('already exists')) return
    throw err
  }
}

async function ensureIndex(collectionId: string, key: string, attributes: string[]) {
  try {
    await db.createIndex(DB_ID, collectionId, key, 'key', attributes)
    console.log(`created index ${collectionId}.${key}`)
  } catch (err: any) {
    if (String(err?.message ?? '').toLowerCase().includes('already exists')) return
    throw err
  }
}

async function run() {
  await ensureCollection(ORDERS, 'orders')
  await ensureCollection(USERS, 'users')
  await ensureCollection(WEBHOOK_EVENTS, 'webhook_events')

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
    await ensureStringAttribute(ORDERS, key, size, required)
  }

  await ensureFloatAttribute(ORDERS, 'faceValue', true)
  await ensureFloatAttribute(ORDERS, 'paymentAmount', true)
  await ensureFloatAttribute(ORDERS, 'feeRate', true)
  await ensureDatetimeAttribute(ORDERS, 'expiresAt', true)

  await ensureStringAttribute(USERS, 'walletAddress', 100, true)
  await ensureStringAttribute(USERS, 'email', 255, true)

  await ensureStringAttribute(WEBHOOK_EVENTS, 'source', 30, true)
  await ensureStringAttribute(WEBHOOK_EVENTS, 'eventKey', 200, true)
  await ensureStringAttribute(WEBHOOK_EVENTS, 'providerStatus', 40, false)
  await ensureStringAttribute(WEBHOOK_EVENTS, 'invoiceId', 100, false)
  await ensureStringAttribute(WEBHOOK_EVENTS, 'providerOrderId', 100, false)
  await ensureStringAttribute(WEBHOOK_EVENTS, 'state', 30, true)

  console.log('created attributes — waiting for Appwrite to process...')
  await sleep(6000)

  await ensureIndex(ORDERS, 'idx_wallet', ['walletAddress'])
  await ensureIndex(ORDERS, 'idx_status', ['status'])
  await ensureIndex(ORDERS, 'idx_wallet_status', ['walletAddress', 'status'])
  await ensureIndex(USERS, 'idx_wallet', ['walletAddress'])
  await ensureIndex(WEBHOOK_EVENTS, 'idx_event_key', ['eventKey'])

  console.log('created indexes')
  console.log('\n✅ DB setup complete')
}

run().catch((err) => {
  console.error('setup failed:', err)
  process.exit(1)
})
