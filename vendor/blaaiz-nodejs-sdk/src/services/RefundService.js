class RefundService {
  constructor (client) {
    this.client = client
  }

  async initiate (refundData) {
    if (!refundData || !refundData.transaction_id) {
      throw new Error('transaction_id is required')
    }

    return this.client.makeRequest('POST', '/api/external/refund', refundData)
  }

  async get (refundId) {
    if (!refundId) {
      throw new Error('Refund ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/refund/${refundId}`)
  }
}

module.exports = RefundService
