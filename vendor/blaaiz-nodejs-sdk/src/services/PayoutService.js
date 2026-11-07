class PayoutService {
  constructor (client) {
    this.client = client
  }

  async initiate (payoutData) {
    const requiredFields = ['wallet_id', 'customer_id', 'method', 'from_currency_id', 'to_currency_id']
    for (const field of requiredFields) {
      if (!payoutData[field]) {
        throw new Error(`${field} is required`)
      }
    }

    // Either from_amount or to_amount must be provided
    if (!payoutData.from_amount && !payoutData.to_amount) {
      throw new Error('Either from_amount or to_amount is required')
    }

    const method = payoutData.method
    const toCurrency = payoutData.to_currency_id

    // Method-specific validations
    if (method === 'bank_transfer') {
      this._validateBankTransferFields(payoutData, toCurrency)
    } else if (method === 'interac') {
      this._validateRequiredFields(payoutData, ['email', 'interac_first_name', 'interac_last_name'], 'interac')
    } else if (method === 'ach' || method === 'wire') {
      this._validateAchWireFields(payoutData, method)
    } else if (method === 'crypto') {
      this._validateRequiredFields(payoutData, ['wallet_address', 'wallet_token', 'wallet_network'], 'crypto')
    } else if (method === 'mobile_money') {
      this._validateRequiredFields(payoutData, ['phone_number', 'mobile_money_operator_id', 'account_name'], 'mobile_money')
    }

    return this.client.makeRequest('POST', '/api/external/payout', payoutData)
  }

  _validateRequiredFields (data, fields, methodName) {
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`${field} is required for ${methodName} method`)
      }
    }
  }

  _validateBankTransferFields (payoutData, toCurrency) {
    // NGN bank transfers require bank_id and account_number
    if (toCurrency === 'NGN') {
      this._validateRequiredFields(payoutData, ['bank_id', 'account_number'], 'NGN bank_transfer')
    } else if (toCurrency === 'GBP') {
      // GBP bank transfers require sort_code and account_number
      this._validateRequiredFields(payoutData, ['sort_code', 'account_number', 'account_name'], 'GBP bank_transfer')
    } else if (toCurrency === 'EUR') {
      // EUR bank transfers require IBAN and BIC code
      this._validateRequiredFields(payoutData, ['iban', 'bic_code', 'account_name'], 'EUR bank_transfer')
    }
  }

  _validateAchWireFields (payoutData, method) {
    const baseFields = ['type', 'account_number', 'account_name', 'account_type', 'bank_name', 'routing_number']
    this._validateRequiredFields(payoutData, baseFields, method)

    if (method === 'wire') {
      this._validateRequiredFields(payoutData, ['swift_code'], 'wire')
    }
  }
}

module.exports = PayoutService
