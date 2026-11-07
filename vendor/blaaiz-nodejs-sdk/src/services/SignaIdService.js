const RELEASE_SCOPES = ['identity', 'id_document', 'address', 'document_images']

const BASE_PATH = '/api/external/signa-id'

class SignaIdService {
  constructor (client) {
    this.client = client
  }

  async createReleaseRequest (requestData) {
    this._validateReleaseRequestData(requestData)

    return this.client.makeRequest('POST', `${BASE_PATH}/release-requests`, requestData)
  }

  async exchangeReleaseCode (code) {
    if (!code || typeof code !== 'string') {
      throw new Error('Release code is required')
    }

    return this.client.makeRequest('POST', `${BASE_PATH}/releases/exchange`, { code })
  }

  async getRelease (releaseId) {
    this._validateReleaseId(releaseId)

    return this.client.makeRequest('GET', `${BASE_PATH}/releases/${encodeURIComponent(releaseId)}`)
  }

  async getReleaseDocument (releaseId, documentId) {
    this._validateReleaseId(releaseId)
    if (!documentId) {
      throw new Error('Document ID is required')
    }

    return this.client.makeRequest(
      'GET',
      `${BASE_PATH}/releases/${encodeURIComponent(releaseId)}/documents/${encodeURIComponent(documentId)}`
    )
  }

  async getWalletStatus (address, filters = {}) {
    if (!address) {
      throw new Error('Wallet address is required')
    }

    const query = new URLSearchParams()
    if (filters.chain_id !== undefined && filters.chain_id !== null) {
      query.set('chain_id', String(filters.chain_id))
    }

    const path = `/api/v1/signa-id/public/wallets/${encodeURIComponent(address)}/status`

    return this.client.makeRequest('GET', query.toString() ? `${path}?${query.toString()}` : path)
  }

  _validateReleaseRequestData (requestData) {
    if (!requestData || typeof requestData !== 'object' || Array.isArray(requestData)) {
      throw new Error('Release request data is required')
    }

    for (const field of ['idempotency_key', 'purpose', 'scopes', 'origin']) {
      if (requestData[field] === undefined || requestData[field] === null || requestData[field] === '') {
        throw new Error(`${field} is required`)
      }
    }

    if (!Array.isArray(requestData.scopes) || requestData.scopes.length === 0) {
      throw new Error('scopes must be a non-empty array')
    }

    for (const scope of requestData.scopes) {
      if (!RELEASE_SCOPES.includes(scope)) {
        throw new Error(`scopes must contain only: ${RELEASE_SCOPES.join(', ')}`)
      }
    }
  }

  _validateReleaseId (releaseId) {
    if (!releaseId) {
      throw new Error('Release ID is required')
    }
  }
}

module.exports = SignaIdService
