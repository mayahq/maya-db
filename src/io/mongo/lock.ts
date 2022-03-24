// import { Collection } from 'mongoose'
import MayaDbData from './blockSchema'
import crypto from 'crypto'

type LockAcquireOpts = {
    acquireFor: number,
    pollInterval: number,
    timeout: number
}

export class MongoLock {
    generateId(): string {
        return crypto.randomBytes(16).toString('hex')
    }

    async acquire(
        path: string, 
        callback: Function,
        opts: LockAcquireOpts = {
            acquireFor: 30000,
            pollInterval: 500,
            timeout: 10000
        },
    ) {
        const lockId = this.generateId()
        const releaseFunction = async () => {
            await MayaDbData.findOneAndUpdate({
                path: path,
                lockAcquiredBy: lockId
            }, {
                $set: {
                    lockExpiresAt: -1,
                    lockAcquiredBy: ''
                }
            }, {
                new: true
            })
        }

        try {
            const now = Date.now()
            let lockDocument = await MayaDbData.findOneAndUpdate({ 
                path: path,
                lockExpiresAt: { $lt: now }
            }, {
                $set: {
                    lockExpiresAt: now + opts.acquireFor,
                    lockAcquiredBy: lockId
                }
            })
    
            if (!lockDocument) {
                const ld = await MayaDbData.findOne({ path: path }).select('_id').lean()
                if (!ld) {
                    const error = new Error('Block does not exist')
                    error.name = 'BLOCK_NOT_FOUND'
                    throw error
                }

                try {
                    lockDocument = await new Promise((resolve, reject) => {
                        const interval = setInterval(async () => {
                            const result = await MayaDbData.findOneAndUpdate({
                                    path: path,
                                    lockExpiresAt: { $lt: Date.now() }
                                },
                                {
                                    $set: {
                                        lockExpiresAt: Date.now() + opts.acquireFor,
                                        lockAcquiredBy: lockId
                                    }
                                },
                                {
                                    new: true
                                }
                            )
                            if (result) {
                                clearInterval(interval)
                                return resolve(result)
                            }
        
                            if (Date.now() - now > opts.timeout) {
                                clearInterval(interval)
                                const err = new Error("Unable to acquire lock: timeout")
                                err.name = "TIME_OUT"
                                return reject(err)
                            }
                        }, opts.pollInterval)
                    })
                    return callback(null, releaseFunction, lockDocument, lockId)
                } catch (e) {
                    return callback(e, releaseFunction, null, null)
                }
            }
    
            return callback(null, releaseFunction, lockDocument, lockId)
        } catch (e) {
            return callback(e, releaseFunction, null, null)
        }
    }

    async release(blockPath: string, lockId: string) {
        await MayaDbData.findOneAndUpdate({
            path: blockPath,
            lockAcquiredBy: lockId
        }, {
            $set: {
                lockExpiresAt: -1,
                lockAcquiredBy: ''
            }
        })
    }
}

export default MongoLock