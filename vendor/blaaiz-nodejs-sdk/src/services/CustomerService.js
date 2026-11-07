class CustomerService {
  constructor (client) {
    this.client = client
  }

  async create (customerData) {
    const requiredFields = ['type', 'email', 'country']
    for (const field of requiredFields) {
      if (!customerData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    if (customerData.type === 'individual') {
      // Personal-ID fields identify an individual; they are prohibited for businesses.
      const individualFields = ['first_name', 'last_name', 'id_type', 'id_number']
      for (const field of individualFields) {
        if (!customerData[field]) {
          throw new Error(`${field} is required when type is individual`)
        }
      }
    } else if (customerData.type === 'business') {
      // Businesses identify via registration_number + incorporation_country, not personal ID.
      const businessFields = ['business_name', 'registration_number', 'incorporation_country']
      for (const field of businessFields) {
        if (!customerData[field]) {
          throw new Error(`${field} is required when type is business`)
        }
      }
    }

    return this.client.makeRequest('POST', '/api/external/customer', customerData)
  }

  async list (filters = {}) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters || {})) {
      if (value === undefined || value === null) continue
      params.append(key, typeof value === 'boolean' ? String(value) : value)
    }
    const query = params.toString()
    const endpoint = query ? `/api/external/customer?${query}` : '/api/external/customer'
    return this.client.makeRequest('GET', endpoint)
  }

  async get (customerId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/customer/${customerId}`)
  }

  async update (customerId, updateData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('PUT', `/api/external/customer/${customerId}`, updateData)
  }

  async addKYC (customerId, kycData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/kyc-data`, kycData)
  }

  async uploadFiles (customerId, fileData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/files`, fileData)
  }

  async listBeneficiaries (customerId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/customer/${customerId}/beneficiary`)
  }

  async getBeneficiary (customerId, beneficiaryId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!beneficiaryId) {
      throw new Error('Beneficiary ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/customer/${customerId}/beneficiary/${beneficiaryId}`)
  }

  async submit (customerId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/submit`)
  }

  async upgradeKybScope (customerId, upgradeData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!upgradeData || !Array.isArray(upgradeData.owners) || upgradeData.owners.length === 0) {
      throw new Error('owners is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/upgrade-kyb-scope`, upgradeData)
  }

  async linkKycSession (customerId, signaSessionId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!signaSessionId) {
      throw new Error('signa_session_id is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/kyc-session`, {
      signa_session_id: signaSessionId
    })
  }

  async deleteOwner (customerId, ownerId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!ownerId) {
      throw new Error('Owner ID is required')
    }
    return this.client.makeRequest('DELETE', `/api/external/customer/${customerId}/owner/${ownerId}`)
  }

  async getOwnerFilePresignedUrl (customerId, ownerId, presignedData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!ownerId) {
      throw new Error('Owner ID is required')
    }
    if (!presignedData || !presignedData.file_category) {
      throw new Error('file_category is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/owner/${ownerId}/file/presigned-url`, presignedData)
  }

  async uploadOwnerFiles (customerId, ownerId, fileData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!ownerId) {
      throw new Error('Owner ID is required')
    }
    if (!fileData || !fileData.id_document_front) {
      throw new Error('id_document_front is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/owner/${ownerId}/files`, fileData)
  }

  async listDocuments (customerId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/customer/${customerId}/document`)
  }

  async getDocument (customerId, documentId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!documentId) {
      throw new Error('Document ID is required')
    }
    return this.client.makeRequest('GET', `/api/external/customer/${customerId}/document/${documentId}`)
  }

  async getDocumentPresignedUrl (customerId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/document/presigned-url`)
  }

  async createDocument (customerId, documentData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    const requiredFields = ['type', 'name', 'file_id']
    for (const field of requiredFields) {
      if (!documentData || !documentData[field]) {
        throw new Error(`${field} is required`)
      }
    }
    return this.client.makeRequest('POST', `/api/external/customer/${customerId}/document`, documentData)
  }

  async updateDocument (customerId, documentId, documentData) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!documentId) {
      throw new Error('Document ID is required')
    }
    return this.client.makeRequest('PUT', `/api/external/customer/${customerId}/document/${documentId}`, documentData)
  }

  async deleteDocument (customerId, documentId) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }
    if (!documentId) {
      throw new Error('Document ID is required')
    }
    return this.client.makeRequest('DELETE', `/api/external/customer/${customerId}/document/${documentId}`)
  }

  async uploadFileComplete (customerId, fileOptions) {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    if (!fileOptions) {
      throw new Error('File options are required')
    }

    const { file, file_category } = fileOptions // eslint-disable-line camelcase
    let { filename } = fileOptions
    let contentType = fileOptions.content_type || fileOptions.contentType // eslint-disable-line camelcase

    if (!file) {
      throw new Error('File is required')
    }

    if (!file_category) { // eslint-disable-line camelcase
      throw new Error('file_category is required')
    }

    if (!['identity', 'identity_back', 'proof_of_address', 'liveness_check'].includes(file_category)) { // eslint-disable-line camelcase
      throw new Error('file_category must be one of: identity, identity_back, proof_of_address, liveness_check')
    }

    try {
      const presignedResponse = await this.client.makeRequest('POST', '/api/external/file/get-presigned-url', {
        customer_id: customerId, // eslint-disable-line camelcase
        file_category // eslint-disable-line camelcase
      })

      // Handle API response structure: {"data": {"message": "...", "file_id": "...", "url": "..."}}
      let presignedUrl, file_id // eslint-disable-line camelcase
      if (presignedResponse.data && presignedResponse.data.url && presignedResponse.data.file_id) {
        // Structure: {"data": {"message": "...", "file_id": "...", "url": "..."}}
        presignedUrl = presignedResponse.data.url
        file_id = presignedResponse.data.file_id // eslint-disable-line camelcase
      } else if (presignedResponse.url && presignedResponse.file_id) {
        // Direct structure from API docs
        presignedUrl = presignedResponse.url
        file_id = presignedResponse.file_id // eslint-disable-line camelcase
      } else if (presignedResponse.data && presignedResponse.data.data) {
        // Nested structure: {"data": {"data": {"url": "...", "file_id": "..."}}}
        presignedUrl = presignedResponse.data.data.url
        file_id = presignedResponse.data.data.file_id // eslint-disable-line camelcase
      } else {
        throw new Error(`Invalid presigned URL response structure. Expected 'url' and 'file_id' keys. Got: ${JSON.stringify(presignedResponse)}`)
      }

      let fileBuffer
      if (Buffer.isBuffer(file)) {
        fileBuffer = file
      } else if (typeof file === 'string') {
        if (file.startsWith('data:')) {
          // Handle data URL format: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=
          const base64Data = file.split(',')[1]
          if (!base64Data || !base64Data.trim()) {
            throw new Error('Invalid data URL: no base64 data found after the comma')
          }
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data.trim())) {
            throw new Error(
              'The base64 portion of the data URL does not appear to be valid base64. ' +
              'Ensure the string after the comma contains only valid base64 characters.'
            )
          }
          fileBuffer = Buffer.from(base64Data, 'base64')

          // Extract content type from data URL if not provided
          if (!contentType) {
            const mimeMatch = file.match(/data:([^;]+)/)
            if (mimeMatch) {
              contentType = mimeMatch[1]
            }
          }
        } else if (file.startsWith('http://') || file.startsWith('https://')) {
          // Handle URL - download the file
          const downloadResult = await this._downloadFile(file)
          fileBuffer = downloadResult.buffer

          // Use detected content type if not provided
          if (!contentType && downloadResult.contentType) {
            contentType = downloadResult.contentType
          }

          // Use filename from URL if not provided
          if (!filename && downloadResult.filename) {
            filename = downloadResult.filename
          }
        } else {
          // Handle plain base64 string
          if (!file.trim()) {
            throw new Error('The file string is empty')
          }
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.trim())) {
            throw new Error(
              'The file string does not appear to be valid base64. ' +
              'If you meant to pass a file path, Buffer, or URL, use the appropriate format instead.'
            )
          }
          fileBuffer = Buffer.from(file, 'base64')
        }
      } else {
        // Handle Uint8Array or other array-like structures
        fileBuffer = Buffer.from(file)
      }

      // Auto-detect content type if not provided
      if (!contentType) {
        contentType = this._detectContentTypeFromBytes(fileBuffer)
      }
      if (!contentType && filename) {
        contentType = this._getContentTypeFromFilename(filename)
      }
      if (!contentType) {
        throw new Error(
          'Could not determine file content type. Please provide a content_type (e.g., "image/jpeg", "image/png", "application/pdf") in fileOptions.'
        )
      }

      await this._uploadToS3(presignedUrl, fileBuffer, contentType, filename)

      // Map file category to the correct field name expected by Laravel API
      const fileFieldMapping = {
        identity: 'id_file',
        identity_back: 'id_file_back',
        liveness_check: 'liveness_check_file',
        proof_of_address: 'proof_of_address_file'
      }

      const fileFieldName = fileFieldMapping[file_category] // eslint-disable-line camelcase
      if (!fileFieldName) {
        throw new Error(`Unknown file category: ${file_category}`) // eslint-disable-line camelcase
      }

      const fileAssociation = await this.client.makeRequest('POST', `/api/external/customer/${customerId}/files`, {
        [fileFieldName]: file_id // eslint-disable-line camelcase
      })

      return {
        ...fileAssociation,
        file_id, // eslint-disable-line camelcase
        presigned_url: presignedUrl
      }
    } catch (error) {
      // Provide better error information for debugging
      if (error.message && error.message.includes('File upload failed:')) {
        // Re-throw if already wrapped
        throw error
      } else {
        // Wrap other exceptions with context
        throw new Error(`File upload failed: ${error.message}`)
      }
    }
  }

  async _uploadToS3 (presignedUrl, fileBuffer, contentType, filename) {
    const https = require('https')
    const { URL } = require('url')

    return new Promise((resolve, reject) => {
      const url = new URL(presignedUrl)

      const headers = {
        'Content-Length': fileBuffer.length
      }

      if (contentType) {
        headers['Content-Type'] = contentType
      }

      if (filename) {
        headers['Content-Disposition'] = `attachment; filename="${filename}"`
      }

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'PUT',
        headers
      }

      const req = https.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Verify S3 upload success by checking for ETag
            const etag = res.headers.etag || res.headers.ETag
            if (!etag) {
              reject(new Error('S3 upload failed: No ETag received from S3'))
              return
            }

            resolve({
              status: res.statusCode,
              data: responseData,
              etag
            })
          } else {
            reject(new Error(`S3 upload failed with status ${res.statusCode}: ${responseData}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`S3 upload request failed: ${error.message}`))
      })

      req.write(fileBuffer)
      req.end()
    })
  }

  async _downloadFile (url) {
    const https = require('https')
    const http = require('http')
    const { URL } = require('url')
    const path = require('path')

    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const client = urlObj.protocol === 'https:' ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Blaaiz-NodeJS-SDK/1.7.0' // x-release-please-version
        }
      }

      const req = client.request(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this._downloadFile(res.headers.location)
            .then(resolve)
            .catch(reject)
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`))
          return
        }

        const chunks = []
        let totalLength = 0

        res.on('data', (chunk) => {
          chunks.push(chunk)
          totalLength += chunk.length
        })

        res.on('end', () => {
          const buffer = Buffer.concat(chunks, totalLength)

          // Extract content type from response headers
          const contentType = res.headers['content-type']

          // Extract filename from URL path or Content-Disposition header
          let filename = null

          // Try Content-Disposition header first
          const contentDisposition = res.headers['content-disposition']
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
            if (filenameMatch) {
              filename = filenameMatch[1].replace(/['"]/g, '')
            }
          }

          // Fallback to URL path
          if (!filename) {
            const urlPath = urlObj.pathname
            filename = path.basename(urlPath)

            // If no extension, try to add one based on content type
            if (!path.extname(filename) && contentType) {
              const ext = this._getExtensionFromContentType(contentType)
              if (ext) {
                filename += ext
              }
            }
          }

          resolve({
            buffer,
            contentType,
            filename
          })
        })
      })

      req.on('error', (error) => {
        reject(new Error(`File download failed: ${error.message}`))
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('File download timeout'))
      })

      req.end()
    })
  }

  _detectContentTypeFromBytes (buffer) {
    if (!buffer || buffer.length < 4) return null

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg'
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png'
    }
    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return 'image/gif'
    }
    // PDF: 25 50 44 46 (%PDF)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf'
    }
    // WEBP: starts with RIFF....WEBP
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp'
    }
    // BMP: 42 4D
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
      return 'image/bmp'
    }
    // TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
    if ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A && buffer[3] === 0x00) ||
        (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x00 && buffer[3] === 0x2A)) {
      return 'image/tiff'
    }

    return null
  }

  _getContentTypeFromFilename (filename) {
    if (!filename) return null

    const ext = filename.toLowerCase().split('.').pop()
    const extToMime = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      tif: 'image/tiff',
      pdf: 'application/pdf',
      txt: 'text/plain',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    return extToMime[ext] || null
  }

  _getExtensionFromContentType (contentType) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    }

    return mimeToExt[contentType.split(';')[0]] || null
  }
}

module.exports = CustomerService
