class BankService {
  constructor (client) {
    this.client = client
  }

  async list (filters = {}) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters || {})) {
      if (value === undefined || value === null) continue
      params.append(key, typeof value === 'boolean' ? String(value) : value)
    }
    const query = params.toString()
    const endpoint = query ? `/api/external/bank?${query}` : '/api/external/bank'
    return this.client.makeRequest('GET', endpoint)
  }

  async lookupAccount (lookupData) {
    const requiredFields = ['account_number', 'bank_id']
    for (const field of requiredFields) {
      if (!lookupData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/bank/account-lookup', lookupData)
  }

  async verifyPayee (payeeData) {
    const requiredFields = ['sort_code', 'account_number', 'account_name']
    for (const field of requiredFields) {
      if (!payeeData || !payeeData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/bank/payee-verification', payeeData)
  }

  async verifyIban (ibanData) {
    if (!ibanData || !ibanData.iban) {
      throw new Error('iban is required')
    }

    return this.client.makeRequest('POST', '/api/external/bank/iban-verification', ibanData)
  }
}

module.exports = BankService
