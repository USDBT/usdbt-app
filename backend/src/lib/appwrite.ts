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

async function appwriteFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${ENDPOINT}${path}`, { ...init, headers: headers() })
  const body = await res.json() as any
  if (!res.ok) throw new Error(body?.message ?? `Appwrite error ${res.status}`)
  return body
}

export const ID = {
  unique: () => 'unique()',
}

export const Query = {
  equal:       (attr: string, value: unknown) => `equal("${attr}", [${JSON.stringify(value)}])`,
  greaterThan: (attr: string, value: unknown) => `greaterThan("${attr}", [${JSON.stringify(value)}])`,
  lessThan:    (attr: string, value: unknown) => `lessThan("${attr}", [${JSON.stringify(value)}])`,
}

export const databases = {
  createDocument(db: string, col: string, id: string, data: Record<string, unknown>) {
    const documentId = id === 'unique()' ? 'unique()' : id
    return appwriteFetch(`/databases/${db}/collections/${col}/documents`, {
      method: 'POST',
      body: JSON.stringify({ documentId, data }),
    })
  },

  getDocument(db: string, col: string, docId: string) {
    return appwriteFetch(`/databases/${db}/collections/${col}/documents/${docId}`)
  },

  updateDocument(db: string, col: string, docId: string, data: Record<string, unknown>) {
    return appwriteFetch(`/databases/${db}/collections/${col}/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    })
  },

  listDocuments(db: string, col: string, queries: string[] = []) {
    const qs = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join('&')
    const path = `/databases/${db}/collections/${col}/documents${qs ? `?${qs}` : ''}`
    return appwriteFetch(path)
  },
}
