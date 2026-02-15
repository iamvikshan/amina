import { describe, test, expect, mock } from 'bun:test'

// Mock database dependencies before importing
mock.module('../src/database/schemas/Dev', () => ({
  getAiConfig: async () => ({
    globallyEnabled: false,
    model: 'gemini-3-flash-preview',
    embeddingModel: 'text-embedding-005',
    extractionModel: 'gemini-2.5-flash-lite',
    maxTokens: 1024,
    timeoutMs: 30000,
    systemPrompt: 'test',
    temperature: 0.7,
    dmEnabledGlobally: false,
    upstashUrl: '',
  }),
}))
mock.module('../src/config/secrets', () => ({
  secret: {
    GEMINI_KEY: '',
    UPSTASH_VECTOR: '',
    VERTEX_PROJECT_ID: '',
    VERTEX_REGION: 'us-central1',
    GOOGLE_SERVICE_ACCOUNT_JSON: '',
  },
}))
mock.module('../src/config/config', () => ({
  config: {
    AI: {
      MODEL: 'gemini-3-flash-preview',
      EMBEDDING_MODEL: 'text-embedding-005',
      EXTRACTION_MODEL: 'gemini-2.5-flash-lite',
    },
  },
}))

const { validateServiceAccountJson, detectAuthMode } =
  await import('../src/config/aiResponder')

describe('Service Account JSON Validation', () => {
  test('valid service account JSON passes validation', () => {
    const validJson = JSON.stringify({
      client_email: 'test@project.iam.gserviceaccount.com',
      private_key:
        '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
      project_id: 'test-project',
    })
    const base64 = Buffer.from(validJson).toString('base64')

    const result = validateServiceAccountJson(base64)
    expect(result.client_email).toBe('test@project.iam.gserviceaccount.com')
    expect(result.private_key).toContain('BEGIN RSA PRIVATE KEY')
  })

  test('empty string throws base64 error', () => {
    expect(() => validateServiceAccountJson('')).toThrow(/not valid base64/)
  })

  test('invalid base64 characters throw base64 error', () => {
    expect(() => validateServiceAccountJson('not-valid-base64!!!')).toThrow(
      /not valid base64/
    )
  })

  test('valid base64 but not JSON throws error', () => {
    const notJson = Buffer.from('this is not json').toString('base64')
    expect(() => validateServiceAccountJson(notJson)).toThrow(/not valid JSON/)
  })

  test('missing client_email throws error', () => {
    const json = JSON.stringify({
      private_key:
        '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
    })
    const base64 = Buffer.from(json).toString('base64')
    expect(() => validateServiceAccountJson(base64)).toThrow(/client_email/)
  })

  test('missing private_key throws error', () => {
    const json = JSON.stringify({
      client_email: 'test@project.iam.gserviceaccount.com',
      project_id: 'test-project',
    })
    const base64 = Buffer.from(json).toString('base64')
    expect(() => validateServiceAccountJson(base64)).toThrow(/private_key/)
  })

  test('missing project_id throws error', () => {
    const json = JSON.stringify({
      client_email: 'test@project.iam.gserviceaccount.com',
      private_key:
        '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
    })
    const base64 = Buffer.from(json).toString('base64')
    expect(() => validateServiceAccountJson(base64)).toThrow(/project_id/)
  })
})

describe('Auth Mode Auto-Detection', () => {
  test('api-key mode when no Vertex credentials provided', () => {
    expect(detectAuthMode('', '')).toBe('api-key')
  })

  test('vertex mode when service account and project are present', () => {
    const validJson = JSON.stringify({
      client_email: 'test@project.iam.gserviceaccount.com',
      private_key:
        '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
    })
    const hasServiceAccount = Buffer.from(validJson).toString('base64')
    expect(detectAuthMode(hasServiceAccount, 'test-project')).toBe('vertex')
  })

  test('api-key mode when service account present but no project', () => {
    const validJson = JSON.stringify({
      client_email: 'test@x.iam.gserviceaccount.com',
      private_key:
        '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
    })
    const hasServiceAccount = Buffer.from(validJson).toString('base64')
    expect(detectAuthMode(hasServiceAccount, '')).toBe('api-key')
  })
})
