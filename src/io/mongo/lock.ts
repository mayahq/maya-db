// import { Collection } from 'mongoose'
import MayaDbData from './blockSchema'
import crypto from 'crypto'

type LockAcquireOpts = {
    acquireFor: number,
    pollInterval: number,
    timeout: number
}

class Lock {
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
        try {
            const lockId = this.generateId()
    
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
    
            const releaseFunction = async () => {
                await MayaDbData.findOneAndUpdate({
                    path: path,
                    lockAcquiredBy: lockId
                }, {
                    $set: {
                        lockExpiresAt: -1,
                        lockAcquiredBy: ''
                    }
                })
            }
    
            if (!lockDocument) {
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
                    return callback(null, releaseFunction, lockDocument)
                } catch (e) {
                    return callback(e, null, null)
                }
            }
    
            return callback(null, releaseFunction, lockDocument)
        } catch (e) {
            return callback(e, null, null)
        }
    }
}

export default Lock