class CollectionService {
  constructor (client) {
    this.client = client
  }

  async initiate (collectionData) {
    const requiredFields = ['method', 'amount', 'wallet_id']
    for (const field of requiredFields) {
      if (!collectionData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    // Card collections need the customer and the card details up front.
    if (collectionData.method === 'card') {
      const cardFields = ['customer_id', 'card_holder_name', 'card_number', 'expiry', 'cvc']
      for (const field of cardFields) {
        if (!collectionData[field]) {
          throw new Error(`${field} is required for card method`)
        }
      }
    }

    return this.client.makeRequest('POST', '/api/external/collection', collectionData)
  }

  async initiateCrypto (cryptoData) {
    const requiredFields = ['amount', 'wallet_id', 'network', 'token']
    for (const field of requiredFields) {
      if (!cryptoData || !cryptoData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/collection/crypto', cryptoData)
  }

  async getCryptoNetworks (filters = {}) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters || {})) {
      if (value === undefined || value === null) continue
      params.append(key, typeof value === 'boolean' ? String(value) : value)
    }
    const query = params.toString()
    const endpoint = query ? `/api/external/collection/crypto/networks?${query}` : '/api/external/collection/crypto/networks'
    return this.client.makeRequest('GET', endpoint)
  }

  async attachCustomer (attachData) {
    const requiredFields = ['customer_id', 'transaction_id']
    for (const field of requiredFields) {
      if (!attachData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/collection/attach-customer', attachData)
  }

  async initiateInteracMoneyRequest (interacData) {
    const requiredFields = ['amount', 'email']
    for (const field of requiredFields) {
      if (!interacData || !interacData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/collection/interac-money-request', interacData)
  }

  async acceptInteracMoneyRequest (interacData) {
    if (!interacData || !interacData.reference_number) {
      throw new Error('reference_number is required')
    }

    return this.client.makeRequest('POST', '/api/external/collection/accept-interac-money-request', interacData)
  }
}

module.exports = CollectionService
