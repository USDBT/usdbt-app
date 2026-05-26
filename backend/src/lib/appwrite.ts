const ENDPOINT = process.env.APPWRITE_ENDPOINT!
const PROJECT  = process.env.APPWRITE_PROJECT_ID!
const KEY      = process.env.APPWRITE_API_KEY!

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
  equal:       (attr: string, value: unknown) => `equal("${attr}",[${JSON.stringify(value)}])`,
  greaterThan: (attr: string, value: unknown) => `greaterThan("${attr}",[${JSON.stringify(value)}])`,
  lessThan:    (attr: string, value: unknown) => `lessThan("${attr}",[${JSON.stringify(value)}])`,
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
    if (queries.length === 0) return appwriteFetch(base)
    // Use literal queries[] key + encodeURIComponent (spaces → %20 not +)
    const qs = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join('&')
    return appwriteFetch(`${base}?${qs}`)
  },
}
