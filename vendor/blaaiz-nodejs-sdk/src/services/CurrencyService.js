class CurrencyService {
  constructor (client) {
    this.client = client
  }

  async list () {
    return this.client.makeRequest('GET', '/api/external/currency')
  }
}

module.exports = CurrencyService
