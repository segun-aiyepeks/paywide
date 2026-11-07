const REQUIREMENTS = ['DOCUMENTS', 'SELFIE', 'FACE_MATCH', 'PROOF_OF_ADDRESS']

const DOCUMENT_TYPES = [
  'PASSPORT',
  'ID_CARD',
  'DRIVERS',
  'RESIDENCE_PERMIT',
  'UTILITY_BILL',
  'BANK_STATEMENT',
  'SELFIE'
]

const CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]

const BASE_PATH = '/api/external/compliance/kyc/sessions'

class SignaService {
  constructor (client) {
    this.client = client
  }

  async createSession (sessionData) {
    this._validateSessionData(sessionData)

    return this.client.makeRequest('POST', BASE_PATH, sessionData)
  }

  async listSessions (filters = {}) {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value))
      }
    }

    const endpoint = query.toString() ? `${BASE_PATH}?${query.toString()}` : BASE_PATH

    return this.client.makeRequest('GET', endpoint)
  }

  async getSession (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest('GET', `${BASE_PATH}/${encodeURIComponent(sessionId)}`)
  }

  async submitSession (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest('POST', `${BASE_PATH}/${encodeURIComponent(sessionId)}/submit`)
  }

  async cancelSession (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest('POST', `${BASE_PATH}/${encodeURIComponent(sessionId)}/cancel`)
  }

  async createDocumentUploadUrl (sessionId, uploadData) {
    this._validateSessionId(sessionId)
    this._validateDocumentUploadUrlData(uploadData)

    return this.client.makeRequest(
      'POST',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/documents/upload-url`,
      uploadData
    )
  }

  async uploadSessionDocument (sessionId, documentData) {
    this._validateSessionId(sessionId)
    this._validateDocumentData(documentData)

    return this.client.makeRequest(
      'POST',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/documents`,
      documentData
    )
  }

  async issueVerificationLink (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest(
      'POST',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/verification-link`
    )
  }

  async issueAccessToken (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest(
      'POST',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/access-token`
    )
  }

  async getSessionApplicantData (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest(
      'GET',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/applicant-data`
    )
  }

  async listSessionDocuments (sessionId) {
    this._validateSessionId(sessionId)

    return this.client.makeRequest(
      'GET',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/documents`
    )
  }

  async getSessionDocument (sessionId, documentId) {
    this._validateSessionId(sessionId)
    this._validateDocumentId(documentId)

    return this.client.makeRequest(
      'GET',
      `${BASE_PATH}/${encodeURIComponent(sessionId)}/documents/${encodeURIComponent(documentId)}`
    )
  }

  // Short aliases mirror the create/list/get style used by the other SDK resources.
  async create (sessionData) {
    return this.createSession(sessionData)
  }

  async list (filters = {}) {
    return this.listSessions(filters)
  }

  async get (sessionId) {
    return this.getSession(sessionId)
  }

  async submit (sessionId) {
    return this.submitSession(sessionId)
  }

  async cancel (sessionId) {
    return this.cancelSession(sessionId)
  }

  async uploadDocument (sessionId, documentData) {
    return this.uploadSessionDocument(sessionId, documentData)
  }

  _validateSessionData (sessionData) {
    if (!sessionData || typeof sessionData !== 'object' || Array.isArray(sessionData)) {
      throw new Error('Session data is required')
    }

    for (const field of ['customer_reference', 'idempotency_key', 'requirements']) {
      if (sessionData[field] === undefined || sessionData[field] === null || sessionData[field] === '') {
        throw new Error(`${field} is required`)
      }
    }

    if (!Array.isArray(sessionData.requirements) || sessionData.requirements.length === 0) {
      throw new Error('requirements must be a non-empty array')
    }

    for (const requirement of sessionData.requirements) {
      if (typeof requirement !== 'string' || !REQUIREMENTS.includes(requirement.toUpperCase())) {
        throw new Error(`requirements must contain only: ${REQUIREMENTS.join(', ')}`)
      }
    }
  }

  _validateDocumentUploadUrlData (uploadData) {
    this._validateDocumentDataShape(uploadData, ['file_name', 'id_doc_type'])

    if (!DOCUMENT_TYPES.includes(uploadData.id_doc_type.toUpperCase())) {
      throw new Error(`id_doc_type must be one of: ${DOCUMENT_TYPES.join(', ')}`)
    }
  }

  _validateDocumentData (documentData) {
    this._validateDocumentDataShape(documentData, [
      'filename',
      'content_type',
      'id_doc_type',
      'country'
    ])

    if (!CONTENT_TYPES.includes(documentData.content_type.toLowerCase())) {
      throw new Error(`content_type must be one of: ${CONTENT_TYPES.join(', ')}`)
    }

    if (!DOCUMENT_TYPES.includes(documentData.id_doc_type.toUpperCase())) {
      throw new Error(`id_doc_type must be one of: ${DOCUMENT_TYPES.join(', ')}`)
    }

    const hasStagedFile = typeof documentData.file_name === 'string' && documentData.file_name !== ''
    const hasInlineContent = typeof documentData.content_base64 === 'string' && documentData.content_base64 !== ''

    if (hasStagedFile === hasInlineContent) {
      throw new Error('Provide exactly one of file_name or content_base64')
    }
  }

  _validateDocumentDataShape (data, fields) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Document data is required')
    }

    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new Error(`${field} is required`)
      }
    }
  }

  _validateSessionId (sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }
  }

  _validateDocumentId (documentId) {
    if (!documentId) {
      throw new Error('Document ID is required')
    }
  }
}

module.exports = SignaService
