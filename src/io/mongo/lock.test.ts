import mongoose from 'mongoose'
import MayaDbBlock from './blockSchema'
import MayaDbCollection from './collectionSchema'
import Lock from './lock'

const sleep = (timeout: number) => new Promise(res => setTimeout(res, timeout))

describe('Mongo Lock class', () => {
    beforeAll(async () => {
        await MayaDbCollection.create({ path: '/locktest' })
        await MayaDbBlock.create({
            path: '/locktest/tblock',
            data: JSON.stringify({ a: 1 })
        })
    })

    afterAll(async () => {
        const regexp = `^/locktest`
        await MayaDbCollection.deleteMany({ path: { $regex: regexp } })
        await MayaDbBlock.deleteMany({ path: { $regex: regexp } })
    })

    test('Lock goes stale if not released', async () => {
        const lock = new Lock()
        const hold = async () => {
            try {
                await lock.acquire('/locktest/tblock', async (e: Error, releaseLock: Function) => {
                    if (e) {
                        fail('Acquiring lock failed')
                    }
                    // Never calls releaseLock
                    await sleep(1000)
                }, {
                    acquireFor: 3000,
                    pollInterval: 500,
                    timeout: 30000
                })
            } catch (e) {
                console.log('oops', e)
            }
        }

        const increment = () => new Promise((resolve, reject) => {
            lock.acquire('/locktest/tblock', async (e: Error, releaseLock: Function) => {
                try {
                    if (e) {
                        reject(e)
                    }
                    
                    try {
                        const block = await MayaDbBlock.findOne({ path: '/locktest/tblock' })
                        block.data = JSON.stringify({ a: 2 })
                        await block.save()
                        await releaseLock()
                        resolve(block)
                    } catch (e) {
                        await releaseLock()
                        reject(e)
                    }
                } catch (e) {
                    reject(e)
                }
            }, {
                acquireFor: 3000,
                pollInterval: 500,
                timeout: 30000
            })
        })

        await hold()
        await sleep(100)
        await increment()

        try {
            const tblockDoc = await MayaDbBlock.findOne({ path: '/locktest/tblock' })
            expect(JSON.parse(tblockDoc.data).a).toBe(2)
            expect(tblockDoc.lockExpiresAt).toBe(-1)
        } catch (e) {
            console.log(e)
            fail('Cannot fetch block')
        }
        
    }, 10000)

    test('Acquiring lock works', async () => {
        const lock = new Lock()

        const increment = () => new Promise((resolve, reject) => {
            lock.acquire('/locktest/tblock', async (e: Error, releaseLock: Function) => {
                try {
                    if (e) {
                        reject(e)
                    }
                    
                    try {
                        const block = await MayaDbBlock.findOne({ path: '/locktest/tblock' })
                        
                        // Increment
                        const data = JSON.parse(block.data)
                        data.a = data.a + 1
                        block.data = JSON.stringify(data)

                        await block.save()
                        await releaseLock()
                        resolve(block)
                    } catch (e) {
                        await releaseLock()
                        reject(e)
                    }
                } catch (e) {
                    fail('Unable to perform increment operation in the first place')
                }
            }, {
                acquireFor: 10000,
                pollInterval: 500,
                timeout: 30000
            })
        })

        const currBlock = await MayaDbBlock.findOne({ path: '/locktest/tblock' })
        const currVal = JSON.parse(currBlock.data).a

        await Promise.all([increment(), increment()])
        const newBlock = await MayaDbBlock.findOne({ path: '/locktest/tblock' })
        expect(JSON.parse(newBlock.data).a).toBe(currVal+2)
    }, 10000)
})