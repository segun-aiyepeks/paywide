class BlaaizError extends Error {
  constructor (message, status, code) {
    super(message)
    this.name = 'BlaaizError'
    this.status = status
    this.code = code
  }
}

module.exports = BlaaizError
