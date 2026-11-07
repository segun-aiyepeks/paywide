const https = require('https')
const http = require('http')
const { URL, URLSearchParams } = require('url')
const BlaaizError = require('./error')

const ALL_SCOPES = [
  'wallet:read', 'currency:read', 'bank:read', 'customer:read', 'customer:write',
  'beneficiary:read', 'virtual-account:read', 'virtual-account:create', 'virtual-account:close',
  'collection:create', 'collection:crypto:create', 'collection:interac:accept',
  'payout:create', 'swap:create', 'transaction:read', 'fees:read', 'file:upload',
  'webhook:read', 'webhook:write', 'webhook:replay', 'rates:read',
  'compliance-kyc:read', 'compliance-kyc:create', 'compliance-kyc:cancel', 'compliance-kyc:pii:read'
]

function isPresent (value) {
  return typeof value === 'string' && value !== '' && value !== '0'
}

class BlaaizAPIClient {
  constructor (apiKey, options = {}) {
    if (apiKey && typeof apiKey === 'object') {
      options = apiKey
      apiKey = undefined
    }

    this.clientId = options.client_id || ''
    this.clientSecret = options.client_secret || ''
    this.oauthScope = (options.oauth_scope === undefined || options.oauth_scope === null)
      ? ALL_SCOPES.join(' ')
      : options.oauth_scope
    this.apiKey = apiKey || options.api_key || ''
    this.baseURL = options.baseURL || options.base_url || 'https://api-dev.blaaiz.com'
    this.timeout = options.timeout || 30000

    this.useOAuth = isPresent(this.clientId) && isPresent(this.clientSecret)

    if (!this.useOAuth && !isPresent(this.apiKey)) {
      throw new BlaaizError(
        'Authentication required: provide either client_id and client_secret for OAuth, or an API key for legacy authentication'
      )
    }

    this.accessToken = null
    this.tokenExpiresAt = null

    this.defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Blaaiz-NodeJS-SDK/1.7.0' // x-release-please-version
    }
  }

  async getOAuthToken () {
    const now = Math.floor(Date.now() / 1000)
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return this.accessToken
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.oauthScope
    }).toString()

    let response
    try {
      response = await this._requestToken(body)
    } catch (error) {
      throw new BlaaizError(
        `OAuth token request failed: ${error.message}`,
        null,
        'OAUTH_ERROR'
      )
    }

    if (response.status < 200 || response.status >= 300) {
      let errorData = null
      try {
        errorData = JSON.parse(response.body)
      } catch (error) {
        errorData = null
      }
      throw new BlaaizError(
        (errorData && (errorData.error_description || errorData.message)) ||
          `OAuth token request failed: HTTP ${response.status}`,
        response.status,
        (errorData && errorData.error) || 'OAUTH_ERROR'
      )
    }

    let parsed = null
    try {
      parsed = JSON.parse(response.body)
    } catch (error) {
      parsed = null
    }

    if (!parsed || !parsed.access_token) {
      throw new BlaaizError(
        'Failed to parse OAuth token response',
        response.status,
        'OAUTH_PARSE_ERROR'
      )
    }

    let expiresIn = Number(parsed.expires_in)
    if (!Number.isFinite(expiresIn)) expiresIn = 900
    this.accessToken = parsed.access_token
    this.tokenExpiresAt = Math.floor(Date.now() / 1000) + expiresIn - 60

    return this.accessToken
  }

  async getAuthHeaders () {
    if (this.useOAuth) {
      const token = await this.getOAuthToken()
      return { Authorization: `Bearer ${token}` }
    }
    return { 'x-blaaiz-api-key': this.apiKey }
  }

  _requestToken (body) {
    return new Promise((resolve, reject) => {
      const url = new URL('/oauth/token', this.baseURL)
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: this.timeout
      }

      const client = url.protocol === 'https:' ? https : http
      const req = client.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          resolve({ status: res.statusCode, body: responseData })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('OAuth token request timeout'))
      })

      req.write(body)
      req.end()
    })
  }

  async makeRequest (method, endpoint, data = null, headers = {}) {
    const authHeaders = await this.getAuthHeaders()

    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseURL)
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: { ...this.defaultHeaders, ...authHeaders, ...headers },
        timeout: this.timeout
      }

      const client = url.protocol === 'https:' ? https : http
      const req = client.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData)

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                data: parsedData,
                status: res.statusCode,
                headers: res.headers
              })
            } else {
              reject(new BlaaizError(
                parsedData.message || 'API request failed',
                res.statusCode,
                parsedData.code
              ))
            }
          } catch (error) {
            reject(new BlaaizError(
              'Failed to parse API response',
              res.statusCode,
              'PARSE_ERROR'
            ))
          }
        })
      })

      req.on('error', (error) => {
        reject(new BlaaizError(
          `Request failed: ${error.message}`,
          null,
          'REQUEST_ERROR'
        ))
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new BlaaizError(
          'Request timeout',
          null,
          'TIMEOUT_ERROR'
        ))
      })

      if (data && method.toUpperCase() !== 'GET') {
        req.write(JSON.stringify(data))
      }

      req.end()
    })
  }
}

BlaaizAPIClient.ALL_SCOPES = ALL_SCOPES

module.exports = BlaaizAPIClient
