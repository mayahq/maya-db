import mongoose from 'mongoose'
import { HttpIoClient } from '../../io/http/http'
import MayaDbBlock from '../../io/mongo/blockSchema'
import MayaDbCollection from '../../io/mongo/collectionSchema'
import { Collection } from '../collection'

const API_URL = `http://localhost:9000/db-operation`
const io = new HttpIoClient({
    apiUrl: API_URL,
    auth: {}
})

const rootCollection = new Collection({
    absPath: '/remoteBlockTest',
    io
})

/**
 * Initial hierarchy - 
 * 
 * remoteBlockTest
 * |--rblock
 * |--wblock
 * |--ublock
 * |--cublock
 */
describe('Remote StorageBlock implementation', () => {
    beforeAll(async () => {
        const data = {
            counter: 1,
            user: {
                name: 'Dushyant',
                age: 21,
                education: {
                    college: 'BITS Pilani',
                    year: 4,
                    major: 'Computer Science'
                }
            }
        }

        const cuData = {
            vals: [1]
        }

        await MayaDbCollection.create({ path: '/remoteBlockTest' })
        await MayaDbBlock.create({ path: '/remoteBlockTest/rblock', data: JSON.stringify(data) })
        await MayaDbBlock.create({ path: '/remoteBlockTest/wblock', data: JSON.stringify(data) })
        await MayaDbBlock.create({ path: '/remoteBlockTest/ublock', data: JSON.stringify(data) })
        await MayaDbBlock.create({ path: '/remoteBlockTest/cublock', data: JSON.stringify(cuData) })
    })

    afterAll(async () => {
        const regexp = `^/remoteBlockTest`
        await MayaDbCollection.deleteMany({ path: { $regex: regexp } })
        await MayaDbBlock.deleteMany({ path: { $regex: regexp } })
    })

    test('Lock-and-get operation works for simple read', async () => {
        const block = rootCollection.block('rblock')
        const result = await block.lockAndGet({
            user: {
                name: 'Sneha',
                id: '2018A7PS0179P',
                education: {
                    college: ''
                }
            }
        })
        expect(result).toEqual({
            user: {
                name: 'Dushyant',
                id: '2018A7PS0179P',
                education: {
                    college: 'BITS Pilani'
                }
            }
        })
    })

    test('Lock-and-set operation works for simple write', async () => {
        const block = rootCollection.block('wblock')
        const result = await block.lockAndSet({
            counter: 2,
            user: {
                name: 'Sneha',
                education: {
                    college: 'NMIMS',
                    major: 'Design'
                }
            }
        })
        expect(result).toEqual({
            counter: 2,
            user: {
                name: 'Sneha',
                age: 21,
                education: {
                    college: 'NMIMS',
                    year: 4,
                    major: 'Design'
                }
            }
        })

        const blockDoc = await MayaDbBlock.findOne({ path: '/remoteBlockTest/wblock' })
        const blockData = JSON.parse(blockDoc.data)
        expect(blockData.user.name).toBe('Sneha')
    })

    test('Lock-and-update operation works for simple update', async () => {
        const block = rootCollection.block('ublock')
        const result = await block.lockAndUpdate({
            counter: { $set: 2 }
        })
        expect(result.counter).toBe(2)

        const blockDoc = await MayaDbBlock.findOne({ path: '/remoteBlockTest/ublock' })
        const blockData = JSON.parse(blockDoc.data)
        expect(blockData.counter).toBe(2)
    })

    test('Lock-and-update operation works for concurrent update', async () => {
        const block = rootCollection.block('cublock')
        const increment = async () => block.lockAndUpdate({
            vals: { $push: [1] }
        })

        await Promise.all([increment(), increment()])
        
        const blockDoc = await MayaDbBlock.findOne({ path: '/remoteBlockTest/cublock' })
        const blockData = JSON.parse(blockDoc.data)
        expect(blockData.vals).toEqual([1,1,1])
    })
})