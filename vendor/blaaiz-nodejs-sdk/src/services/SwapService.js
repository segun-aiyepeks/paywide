class SwapService {
  constructor (client) {
    this.client = client
  }

  async initiate (swapData) {
    const requiredFields = ['from_business_wallet_id', 'to_business_wallet_id', 'amount']
    for (const field of requiredFields) {
      if (!swapData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/swap', swapData)
  }
}

module.exports = SwapService
