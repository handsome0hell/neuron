import { remote } from 'electron'
import { AddressType } from 'models/keys/address'
import { TransactionsService } from 'services/tx'
import CellsService from 'services/cells'
import LockUtils from 'models/lock-utils'
import { TransactionStatus } from 'types/cell-types'
import { OutputStatus } from 'services/tx/params'
import NodeService from 'services/node'
import Store from 'models/store'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

export interface Address {
  walletId: string
  address: string
  path: string
  addressType: AddressType
  addressIndex: number
  txCount: number
  liveBalance: string
  sentBalance: string
  pendingBalance: string
  balance: string
  blake160: string
  version: AddressVersion
  description?: string
  isImporting?: boolean | undefined
}

export default class AddressDao {
  public static create = (addresses: Address[]): Address[] => {
    const result = addresses.map(address => {
      address.txCount = address.txCount || 0
      address.liveBalance = address.liveBalance || '0'
      address.sentBalance = address.sentBalance || '0'
      address.pendingBalance = address.pendingBalance || '0'
      address.balance = (BigInt(address.liveBalance) + BigInt(address.sentBalance)).toString()
      return address
    })
    return AddressStore.add(result)
  }

  public static getAll(): Address[] {
    return AddressStore.getAll()
  }

  // txCount include all txs in db
  // liveBalance means balance of OutputStatus.Live cells (already in chain and not spent)
  // sentBalance means balance of OutputStatus.Sent cells (sent to me but not committed)
  // pendingBalance means balance of OutputStatus.Pending cells (sent from me, but not committed)
  // so the final balance is (liveBalance + sentBalance - pendingBalance)
  // balance is the balance of the cells those who don't hold data or type script
  public static updateTxCountAndBalance = async (
    address: string,
    url: string = NodeService.getInstance().core.rpc.node.url
  ): Promise<Address[]> => {
    const all = AddressStore.getAll()
    const toUpdate = all.filter(value => {
      return value.address === address
    })
    const others = all.filter(value => {
      return value.address !== address
    })

    const txCount: number = await TransactionsService.getCountByAddressAndStatus(address, [
      TransactionStatus.Pending,
      TransactionStatus.Success,
    ], url)
    const lockUtils = new LockUtils(await LockUtils.systemScript(url))
    const result = await Promise.all(
      toUpdate.map(async entity => {
        const item = entity
        item.txCount = txCount
        const lockHashes: string[] = lockUtils.addressToAllLockHashes(item.address)
        item.liveBalance = await CellsService.getBalance(lockHashes, OutputStatus.Live)
        item.sentBalance = await CellsService.getBalance(lockHashes, OutputStatus.Sent)
        item.pendingBalance = await CellsService.getBalance(lockHashes, OutputStatus.Pending)
        item.balance = (BigInt(item.liveBalance) + BigInt(item.sentBalance)).toString()
        return item
      })
    )

    AddressStore.updateAll(toUpdate.concat(others))
    return result
  }

  public static nextUnusedAddress(walletId: string, version: AddressVersion): Address | undefined {
    const addresses = AddressStore.getAll().filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Receiving
        && value.txCount === 0
    })
    return addresses.sort((lhs, rhs) => {
      return lhs.addressIndex - rhs.addressIndex
    })[0]
  }

  public static unusedAddressesCount(walletId: string, version: AddressVersion): [number, number] {
    const addresses = AddressStore.getAll()
    const receivingCount = addresses.filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Receiving
        && value.txCount === 0
    }).length
    const changeCount = addresses.filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Change
        && value.txCount === 0
    }).length

    return [receivingCount, changeCount]
  }

  public static nextUnusedChangeAddress(walletId: string, version: AddressVersion): Address | undefined {
    const addresses = AddressStore.getAll().filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Change
        && value.txCount === 0
    })
    return addresses.sort((lhs, rhs) => {
      return lhs.addressIndex - rhs.addressIndex
    })[0]
  }

  public static allAddresses(version: AddressVersion): Address[] {
    const all = AddressStore.getAll()
    return all.filter(value => {
      return value.version === version
    })
  }

  public static allAddressesByWalletId(walletId: string, version: AddressVersion): Address[] {
    return AddressStore.getAll()
      .filter(value => value.walletId === walletId && value.version === version)
      .sort((lhs, rhs) => {
        return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
      })
  }

  public static usedAddressesByWalletId(walletId: string, version: AddressVersion): Address[] {
    const all = AddressStore.getAll()
    return all.filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.txCount !== 0
    })
  }

  public static findByAddress(address: string, walletId: string): Address | undefined {
    return AddressStore.getAll().find(value => {
      return value.address === address && value.walletId == walletId
    })
  }

  public static findByAddresses(addresses: string[]): Address[] {
    return AddressStore.getAll().filter(value => {
      return addresses.includes(value.address)
    })
  }

  public static maxAddressIndex(walletId: string, addressType: AddressType, version: AddressVersion): Address | undefined {
    const addresses = AddressStore.getAll().filter(value => {
      return value.walletId === walletId
        && value.addressType === addressType
        && value.version === version
    })
    return addresses.sort((lhs, rhs) => {
      return lhs.addressIndex > rhs.addressIndex ? -1 : 1
    })[0]
  }

  public static updateDescription(walletId: string, address: string, description: string): Address | undefined {
    const item = AddressDao.findByAddress(address, walletId)
    if (!item) {
      return undefined
    }
    item.description = description
    return AddressStore.update(item)
  }

  public static deleteByWalletId(walletId: string): Address[] {
    const all = AddressStore.getAll()
    const toKeep = all.filter(value => {
      return value.walletId !== walletId
    })
    const deleted = all.filter(value => {
      return value.walletId === walletId
    })
    AddressStore.updateAll(toKeep)

    return deleted
  }

  public static updateAll(addresses: Address[]) {
    AddressStore.updateAll(addresses)
  }

  public static deleteAll() {
    AddressStore.updateAll([])
  }
}

const isRenderer = process && process.type === 'renderer'
const addressDbChangedSubject = isRenderer
  ? remote.require('./models/subjects/address-db-changed-subject').default.getSubject()
  : AddressDbChangedSubject.getSubject()

/// Persist all addresses as array in `addresses/index.json`.
class AddressStore {
  static MODULE_NAME = 'addresses'
  static ROOT_KEY = 'addresses'
  static store = new Store(AddressStore.MODULE_NAME, 'index.json', '{}')

  static getAll(): Address[] {
    const root = AddressStore.store.readSync<Address[]>(AddressStore.ROOT_KEY)
    return root || []
  }

  static updateAll(addresses: Address[]) {
    AddressStore.store.writeSync(AddressStore.ROOT_KEY, addresses)
    AddressStore.changed()
  }

  static add(addresses: Address[]): Address[] {
    const all = AddressStore.getAll()
    for (let address of addresses) {
      all.push(address)
    }

    AddressStore.updateAll(all)

    return addresses
  }

  static update(address: Address): Address {
    const all = AddressStore.getAll()
    const exist = all.findIndex(value => {
      return value.walletId === address.walletId && value.address === address.address
    })
    if (exist !== -1) {
      all[exist] = address
    } else {
      all.push(address)
    }

    AddressStore.updateAll(all)

    return address
  }

  static changed() {
    addressDbChangedSubject.next("Updated")
  }
}
