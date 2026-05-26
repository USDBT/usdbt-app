export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`[config] Missing required env var: ${name}`)
  return value
}

const ENDPOINT = requiredEnv('APPWRITE_ENDPOINT')
const PROJECT = requiredEnv('APPWRITE_PROJECT_ID')
const KEY = requiredEnv('APPWRITE_API_KEY')

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT,
    'X-Appwrite-Key': KEY,
  }
}

async function appwriteFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: headers() })
  const body = await res.json() as any
  if (!res.ok) {
    const msg = body?.message ?? `Appwrite error ${res.status}`
    console.error('[appwrite] error', res.status, msg, 'url:', url)
    throw new Error(msg)
  }
  return body
}

export const ID = {
  unique: () => 'unique()',
}

export const Query = {
  equal: (attr: string, value: unknown) => `equal("${attr}",${JSON.stringify(Array.isArray(value) ? value : [value])})`,
  greaterThan: (attr: string, value: unknown) => `greaterThan("${attr}",${JSON.stringify(Array.isArray(value) ? value : [value])})`,
  lessThan: (attr: string, value: unknown) => `lessThan("${attr}",${JSON.stringify(Array.isArray(value) ? value : [value])})`,
}

export const databases = {
  createDocument(db: string, col: string, id: string, data: Record<string, unknown>) {
    return appwriteFetch(`${ENDPOINT}/databases/${db}/collections/${col}/documents`, {
      method: 'POST',
      body: JSON.stringify({ documentId: id, data }),
    })
  },

  getDocument(db: string, col: string, docId: string) {
    return appwriteFetch(`${ENDPOINT}/databases/${db}/collections/${col}/documents/${docId}`)
  },

  updateDocument(db: string, col: string, docId: string, data: Record<string, unknown>) {
    return appwriteFetch(`${ENDPOINT}/databases/${db}/collections/${col}/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    })
  },

  listDocuments(db: string, col: string, queries: string[] = []) {
    const base = `${ENDPOINT}/databases/${db}/collections/${col}/documents`
    // Always request up to 500 docs (default is 25 which silently truncates results)
    const parts = ['limit=500']
    for (const q of queries) parts.push(`queries[]=${encodeURIComponent(q)}`)
    return appwriteFetch(`${base}?${parts.join('&')}`)
  },
}
