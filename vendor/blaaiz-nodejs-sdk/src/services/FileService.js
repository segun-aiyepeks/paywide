class FileService {
  constructor (client) {
    this.client = client
  }

  async getPresignedUrl (fileData) {
    const requiredFields = ['customer_id', 'file_category']
    for (const field of requiredFields) {
      if (!fileData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    return this.client.makeRequest('POST', '/api/external/file/get-presigned-url', fileData)
  }
}

module.exports = FileService
