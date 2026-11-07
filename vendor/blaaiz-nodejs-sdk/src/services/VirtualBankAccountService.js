class VirtualBankAccountService {
  constructor (client) {
    this.client = client
  }

  async create (vbaData) {
    const requiredFields = ['wallet_id']
    for (const field of requiredFields) {
      if (!vbaData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/virtual-bank-account', vbaData)
  }

  async list (walletId = null, customerId = null) {
    let endpoint = '/api/external/virtual-bank-account'
    const params = []

    if (walletId) {
      params.push(`wallet_id=${encodeURIComponent(walletId)}`)
    }
    if (customerId) {
      params.push(`customer_id=${encodeURIComponent(customerId)}`)
    }

    if (params.length > 0) {
      endpoint += '?' + params.join('&')
    }

    return this.client.makeRequest('GET', endpoint)
  }

  async get (vbaId) {
    if (!vbaId) {
      throw new Error('Virtual bank account ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/virtual-bank-account/${vbaId}`)
  }

  async close (vbaId, reason = null) {
    if (!vbaId) {
      throw new Error('Virtual bank account ID is required')
    }

    const data = {}
    if (reason !== null) {
      data.reason = reason
    }

    return this.client.makeRequest('POST', `/api/external/virtual-bank-account/${vbaId}/close`, data)
  }

  async getIdentificationType (customerId = null, country = null, type = null) {
    if (!customerId && (!country || !type)) {
      throw new Error('Either customer_id or both country and type are required')
    }

    let endpoint = '/api/external/virtual-bank-account/identification-type'
    const params = []

    if (customerId) {
      params.push(`customer_id=${encodeURIComponent(customerId)}`)
    } else {
      params.push(`country=${encodeURIComponent(country)}`)
      params.push(`type=${encodeURIComponent(type)}`)
    }

    endpoint += '?' + params.join('&')

    return this.client.makeRequest('GET', endpoint)
  }
}

module.exports = VirtualBankAccountService
