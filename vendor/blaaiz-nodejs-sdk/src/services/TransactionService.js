class TransactionService {
  constructor (client) {
    this.client = client
  }

  async list (filters = {}) {
    return this.client.makeRequest('POST', '/api/external/transaction', filters)
  }

  async get (transactionId) {
    if (!transactionId) {
      throw new Error('Transaction ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/transaction/${transactionId}`)
  }
}

module.exports = TransactionService
