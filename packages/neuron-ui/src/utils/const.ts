export const MAX_NETWORK_NAME_LENGTH = 28
export const ADDRESS_LENGTH = 50
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50
export const PAGE_SIZE = 15
export const UNREMOVABLE_NETWORK = 'Testnet'
export const UNREMOVABLE_NETWORK_ID = '0'

export enum ConnectStatus {
  Online = 'online',
  Offline = 'offline',
}
export enum NetworkType {
  Default,
  Normal,
}

export enum Channel {
  Initiate = 'initiate',
  NavTo = 'navTo',
  App = 'app',
  Chain = 'chain',
  Networks = 'networks',
  Transactions = 'transactions',
  Wallets = 'wallets',
  Helpers = 'helpers',
}

export enum Routes {
  Launch = '/',
  General = '/general',
  WalletWizard = '/wizard',
  Wallet = '/wallet',
  Send = '/send',
  Receive = '/receive',
  History = '/history',
  Transaction = '/transaction',
  Addresses = '/addresses',
  Settings = '/settings',
  SettingsGeneral = '/settings/general',
  SettingsWallets = '/settings/wallets',
  SettingsNetworks = '/settings/networks',
  CreateWallet = '/wallets/new',
  ImportWallet = '/wallets/import',
  NetworkEditor = '/network',
  WalletEditor = '/editwallet',
  Prompt = '/prompt',
}

export enum LocalStorage {
  Networks = 'networks',
}

export enum CapacityUnit {
  CKB = 'ckb',
  CKKB = 'ckkb',
  CKGB = 'ckgb',
}

export const PlaceHolders = {
  send: {
    Address: 'eg: ckt1q9gry5zgzrccrjnvnhktjx6remmktn9h6s2fupurhzmgm9',
    Amount: 'eg: 100',
  },
}

export const Tooltips = {
  send: {
    Address: 'Address to send amount',
    Amount: 'Amount to send',
  },
}

export enum Message {
  NameIsRequired = 'name-is-required',
  URLIsRequired = 'url-is-required',
  LengthOfNameShouldBeLessThanOrEqualTo = 'length-of-name-should-be-less-than-or-equal-to',
  NetworkNameExist = 'network-name-exists',
  AtLeastOneAddressNeeded = 'at-least-one-address-needed',
  InvalidAddress = 'invalid-address',
  InvalidAmount = 'invalid-amount',
  AmountNotEnough = 'amount-is-not-enough',
  IsUnremovable = 'is-unremovable',
  ProtocolIsRequired = 'protocol-is-required',
}

export enum MnemonicAction {
  Create = 'create',
  Verify = 'verify',
  Import = 'import',
}
