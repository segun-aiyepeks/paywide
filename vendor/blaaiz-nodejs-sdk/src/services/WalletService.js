class WalletService {
  constructor (client) {
    this.client = client
  }

  async list () {
    return this.client.makeRequest('GET', '/api/external/wallet')
  }

  async get (walletId) {
    if (!walletId) {
      throw new Error('Wallet ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/wallet/${walletId}`)
  }
}

module.exports = WalletService
