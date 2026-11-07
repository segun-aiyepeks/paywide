class RateService {
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
    const endpoint = query ? `/api/external/rate?${query}` : '/api/external/rate'
    return this.client.makeRequest('GET', endpoint)
  }
}

module.exports = RateService
