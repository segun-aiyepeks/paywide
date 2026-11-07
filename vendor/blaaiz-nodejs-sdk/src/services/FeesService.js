class FeesService {
  constructor (client) {
    this.client = client
  }

  async getBreakdown (feeData) {
    const requiredFields = ['from_currency_id', 'to_currency_id']
    for (const field of requiredFields) {
      if (!feeData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    // Either from_amount or to_amount must be provided
    if (!feeData.from_amount && !feeData.to_amount) {
      throw new Error('Either from_amount or to_amount is required')
    }

    return this.client.makeRequest('POST', '/api/external/fees/breakdown', feeData)
  }
}

module.exports = FeesService
