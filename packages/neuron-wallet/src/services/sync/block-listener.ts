import { BehaviorSubject } from 'rxjs'
import NodeService from '../node'
import Queue from './queue'
import RangeForCheck from './range-for-check'
import BlockNumber from './block-number'
import Utils from './utils'

export default class BlockListener {
  private lockHashes: string[]
  private tipBlockNumber: number = -1
  private queue: Queue | undefined | null = undefined
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber
  private interval: number = 5000

  constructor(
    lockHashes: string[],
    tipNumberSubject: BehaviorSubject<string | undefined> = NodeService.getInstance().tipNumberSubject
  ) {
    this.lockHashes = lockHashes
    this.currentBlockNumber = new BlockNumber()
    this.rangeForCheck = new RangeForCheck()

    tipNumberSubject.subscribe(async num => {
      if (num) {
        this.tipBlockNumber = parseInt(num, 10)
      }
    })
  }

  public setLockHashes = (lockHashes: string[]) => {
    this.lockHashes = lockHashes
    if (!this.queue) {
      return
    }
    this.queue.setLockHashes(lockHashes)
  }

  // start listening
  /* eslint no-await-in-loop: "off" */
  /* eslint no-constant-condition: "off" */
  public start = async () => {
    while (this.queue !== null) {
      await this.regenerate()
      await Utils.sleep(this.interval)
    }
  }

  public stop = async (drainCall?: any) => {
    if (!this.queue) {
      return
    }
    await this.queue.kill()
    await this.queue.get().remove(() => true)
    if (drainCall) {
      this.queue.get().drain(drainCall)
    }
    this.queue = null
  }

  public pause = () => {
    if (!this.queue) {
      return
    }
    this.queue.pause()
  }

  public resume = () => {
    if (!this.queue) {
      return
    }

    this.queue.resume()
  }

  public regenerate = async (): Promise<void> => {
    if (this.queue) {
      if (this.queue.get().length() <= 0) {
        this.queue = undefined
      }
      return
    }

    const current = await this.currentBlockNumber.getCurrent()
    const startBlockNumber: string = (current + BigInt(1)).toString()
    const endBlockNumber: string = this.tipBlockNumber.toString()

    // TODO: check this queue stopped
    const queue: Queue | undefined = this.generateQueue(startBlockNumber, endBlockNumber)

    if (queue) {
      queue.process()
    }
  }

  public generateQueue = (startBlockNumber: string, endBlockNumber: string): Queue | undefined => {
    if (BigInt(startBlockNumber) > BigInt(endBlockNumber)) {
      return undefined
    }

    this.queue = new Queue(
      this.lockHashes,
      startBlockNumber,
      endBlockNumber,
      this.currentBlockNumber,
      this.rangeForCheck
    )

    this.queue.get().drain(() => {
      this.queue = undefined
    })

    return this.queue
  }
}
