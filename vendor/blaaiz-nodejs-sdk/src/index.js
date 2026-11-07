const BlaaizError = require('./error')
const BlaaizAPIClient = require('./client')

const CustomerService = require('./services/CustomerService')
const CollectionService = require('./services/CollectionService')
const PayoutService = require('./services/PayoutService')
const WalletService = require('./services/WalletService')
const VirtualBankAccountService = require('./services/VirtualBankAccountService')
const TransactionService = require('./services/TransactionService')
const BankService = require('./services/BankService')
const MomoOperatorService = require('./services/MomoOperatorService')
const CurrencyService = require('./services/CurrencyService')
const FeesService = require('./services/FeesService')
const FileService = require('./services/FileService')
const WebhookService = require('./services/WebhookService')
const RateService = require('./services/RateService')
const SwapService = require('./services/SwapService')
const RefundService = require('./services/RefundService')
const SignaService = require('./services/SignaService')
const SignaIdService = require('./services/SignaIdService')

class Blaaiz {
  constructor (apiKey, options = {}) {
    this.client = new BlaaizAPIClient(apiKey, options)

    this.customers = new CustomerService(this.client)
    this.collections = new CollectionService(this.client)
    this.payouts = new PayoutService(this.client)
    this.wallets = new WalletService(this.client)
    this.virtualBankAccounts = new VirtualBankAccountService(this.client)
    this.transactions = new TransactionService(this.client)
    this.banks = new BankService(this.client)
    this.momoOperators = new MomoOperatorService(this.client)
    this.currencies = new CurrencyService(this.client)
    this.fees = new FeesService(this.client)
    this.files = new FileService(this.client)
    this.webhooks = new WebhookService(this.client)
    this.rates = new RateService(this.client)
    this.swaps = new SwapService(this.client)
    this.refunds = new RefundService(this.client)
    this.signa = new SignaService(this.client)
    this.signaId = new SignaIdService(this.client)
  }

  async testConnection () {
    try {
      await this.currencies.list()
      return true
    } catch (error) {
      return false
    }
  }

  async createCompletePayout (payoutConfig) {
    const { customerData, payoutData } = payoutConfig

    try {
      let customerId = payoutData.customer_id
      if (!customerId && customerData) {
        const customerResult = await this.customers.create(customerData)
        customerId = customerResult.data.data.id
      }

      const feeBreakdown = await this.fees.getBreakdown({
        from_currency_id: payoutData.from_currency_id,
        to_currency_id: payoutData.to_currency_id,
        from_amount: payoutData.from_amount
      })

      const payoutResult = await this.payouts.initiate({
        ...payoutData,
        customer_id: customerId
      })

      return {
        customer_id: customerId,
        payout: payoutResult.data,
        fees: feeBreakdown.data
      }
    } catch (error) {
      throw new BlaaizError(
        `Complete payout failed: ${error.message}`,
        error.status,
        error.code
      )
    }
  }

  async createCompleteCollection (collectionConfig) {
    const { customerData, collectionData, createVBA = false } = collectionConfig

    try {
      let customerId = collectionData.customer_id
      if (!customerId && customerData) {
        const customerResult = await this.customers.create(customerData)
        customerId = customerResult.data.data.id
      }

      let vbaData = null
      if (createVBA) {
        const vbaResult = await this.virtualBankAccounts.create({
          wallet_id: collectionData.wallet_id,
          account_name: customerData ? `${customerData.first_name} ${customerData.last_name}` : 'Customer Account'
        })
        vbaData = vbaResult.data
      }

      const collectionResult = await this.collections.initiate({
        ...collectionData,
        customer_id: customerId
      })

      return {
        customer_id: customerId,
        collection: collectionResult.data,
        virtual_account: vbaData
      }
    } catch (error) {
      throw new BlaaizError(
        `Complete collection failed: ${error.message}`,
        error.status,
        error.code
      )
    }
  }
}

module.exports = {
  Blaaiz,
  BlaaizError,
  CustomerService,
  CollectionService,
  PayoutService,
  WalletService,
  VirtualBankAccountService,
  TransactionService,
  BankService,
  MomoOperatorService,
  CurrencyService,
  FeesService,
  FileService,
  WebhookService,
  RateService,
  SwapService,
  RefundService,
  SignaService,
  SignaIdService
}

module.exports.default = Blaaiz
