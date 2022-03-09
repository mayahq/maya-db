import mongoose from 'mongoose'
import { Collection } from '../../storage/collection'
import MayaDbBlock from './blockSchema'
import MayaDbCollection from './collectionSchema'
import { MongoIoClient } from './mongoIo'

const ioClient = new MongoIoClient()

const rootCollection = new Collection({
    absPath: '/test',
    io: new MongoIoClient()
})


/**
 * Initial hierarchy - 
 * 
 * test
 * |--col1
 * |--|--block1 (contains data)
 * |--|--block2
 * |--|--blockToDelete
 * |--col2
 * |--|--col3
 * |--|--|--block3
 * |--|--|--block4
 * |--|--col4
 * |--colToDelete
 * |--|--col5
 * |--|--|--ctdBlock3
 * |--|--ctdBlock1
 * |--|--ctdBlock2
 */

describe('Mongo I/O Client', () => {

    beforeAll(async () => {
        await MayaDbCollection.create({ path: '/test/col1' })
        await MayaDbCollection.create({ path: '/test/col2' })
        await MayaDbCollection.create({ path: '/test/col2/col3' })
        await MayaDbCollection.create({ path: '/test/col2/col4' })
        await MayaDbCollection.create({ path: '/test/colToDelete' })
        await MayaDbCollection.create({ path: '/test/colToDelete/col5' })

        await MayaDbBlock.create({ path: '/test/col1/block1', data: '{"a": 1}' })
        await MayaDbBlock.create({ path: '/test/col1/block2'})
        await MayaDbBlock.create({ path: '/test/col2/col3/block3'})
        await MayaDbBlock.create({ path: '/test/col2/col3/block4'})
        await MayaDbBlock.create({ path: '/test/col1/blockToDelete' })

        await MayaDbBlock.create({ path: '/test/colToDelete/ctdBlock1' })
        await MayaDbBlock.create({ path: '/test/colToDelete/ctdBlock2' })
        await MayaDbBlock.create({ path: '/test/colToDelete/col5/ctdBlock3' })
    })

    afterAll(async () => {
        const regexp = `^/test`
        await MayaDbCollection.deleteMany({ path: { $regex: regexp } })
        await MayaDbBlock.deleteMany({ path: { $regex: regexp } })
    })

    test('Creating block works if parent collections exist', async () => {
        try {
            const block = await rootCollection.createNewBlock('col1/block5')
            expect(block.absPath).toBe('/test/col1/block5')

            const blockDoc = await MayaDbBlock.findOne({ path: block.absPath })
            expect(blockDoc).toBeTruthy()
        } catch (e: any) {
            console.log(e.message)
            fail('Block creation failed')
        }
    })

    test('Creating block works if some parent collections do not exist', async () => {
        try {
            const block = await rootCollection.createNewBlock('col1/newcol1/newcol2/newblock')
            expect(block.absPath).toBe('/test/col1/newcol1/newcol2/newblock')

            const newcol1Doc = await MayaDbCollection.findOne({ path: '/test/col1/newcol1' })
            expect(newcol1Doc).toBeTruthy()

            const newcol2Doc = await MayaDbCollection.findOne({ path: '/test/col1/newcol1/newcol2' })
            expect(newcol2Doc).toBeTruthy()

            const blockDoc = await MayaDbBlock.findOne({ path: block.absPath })
            expect(blockDoc).toBeTruthy()
        } catch (e: any) {
            console.log(e.message)
            fail('Block creation failed')
        }
    })

    test('Deleting a block works', async () => {
        try {
            await rootCollection.deleteBlock('col1/blockToDelete')
            const blockDoc = await MayaDbBlock.findOne({ path: '/test/col1/blockToDelete' })
            expect(blockDoc).toBeFalsy()
        } catch (e: any) {
            console.log(e.message)
            fail('Block deletion failed')
        }
    })

    test('Getting all blocks works', async () => {
        try {
            const blocks = await rootCollection.collection('col1').getAllBlocks()
            const blockPaths = blocks.map(b => b.absPath)
            expect(blocks.length).toBeGreaterThanOrEqual(2)
            expect(blockPaths).toContain('/test/col1/block1')
            expect(blockPaths).toContain('/test/col1/block2')
        } catch (e: any) {
            console.log(e.message)
            fail('Failed to get all blocks')
        }
    })

    test('Creating a collection works if all parent collections exist', async () => {
        const collection = await rootCollection.createNewCollection('col2/newCol5')
        expect(collection.absPath).toBe('/test/col2/newCol5')
        
        const newCol8 = await MayaDbCollection.findOne({ path: collection.absPath })
        expect(newCol8).toBeTruthy()
    })

    test('Creating collection works if some parent collections do not exist', async () => {
        const collection = await rootCollection.collection('col2/newCol8').createNewCollection('newCol9')
        expect(collection.absPath).toBe('/test/col2/newCol8/newCol9')
        
        const newCol8 = await MayaDbCollection.findOne({ path: '/test/col2/newCol8' })
        expect(newCol8).toBeTruthy()

        const newCol9 = await MayaDbCollection.findOne({ path: '/test/col2/newCol8/newCol9' })
        expect(newCol9).toBeTruthy()
    })

    test('Getting all collections works', async () => {
        const cols = await rootCollection.collection('col2').getAllCollections()
        const colPaths = cols.map(c => c.absPath)

        expect(colPaths.length).toBeGreaterThanOrEqual(2)
        expect(colPaths).toContain('/test/col2/col3')
        expect(colPaths).toContain('/test/col2/col4')
    })

    test('Deleting a collection works', async () => {
        await rootCollection.deleteCollection('colToDelete')

        const colToDelete = await MayaDbCollection.findOne({ path: '/test/colToDelete' })
        expect(colToDelete).toBeFalsy()

        const col5 = await MayaDbCollection.findOne({ path: '/test/colToDelete/col5' })
        expect(col5).toBeFalsy()

        const ctdBlock1 = await MayaDbBlock.findOne({ path: '/test/colToDelete/ctdBlock1' })
        expect(ctdBlock1).toBeFalsy()

        const ctdBlock2 = await MayaDbBlock.findOne({ path: '/test/colToDelete/ctdBlock2' })
        expect(ctdBlock2).toBeFalsy()

        const ctdBlock3 = await MayaDbBlock.findOne({ path: '/test/colToDelete/col5/ctdBlock3' })
        expect(ctdBlock3).toBeFalsy()
    })

    test('Checking if collection exists works', async () => {
        const i1 = await ioClient.includesCollection('/test/col1')
        expect(i1).toBe(true)

        const i2 = await ioClient.includesCollection('/test/random')
        expect(i2).toBe(false)
    })

    test('Checking if block exists works', async () => {
        const i1 = await ioClient.includesBlock('/test/col1/block1')
        expect(i1).toBe(true)

        const i2 = await ioClient.includesBlock('/test/col1/random')
        expect(i2).toBe(false)
    })

    test('Reading from block works', async () => {
        const data = await ioClient.readFromBlock('/test/col1/block1')
        expect(data).toEqual({ a: 1 })
    })

    test('Writing to block works', async () => {
        const data = { b: 2 }
        const blockPath = '/test/col1/block2'
        
        await ioClient.writeToBlock(blockPath, data)
        const block = await MayaDbBlock.findOne({ path: blockPath })
        expect(JSON.parse(block.data)).toEqual(data)
    })

    test('Acquiring lock on block works', async () => {
        const sleep = (time: number) => new Promise((resolve, reject) => setTimeout(resolve, time))
        const increment = async () => {
            const res = await ioClient.acquireLockOnBlock('/test/col1/block1', async () => {
                const blockDoc = await MayaDbBlock.findOne({ path: '/test/col1/block1' })
                const data = JSON.parse(blockDoc.data)
                await sleep(2000)
                data.a = data.a + 1
                blockDoc.data = JSON.stringify(data)
                await blockDoc.save()
                return blockDoc
            })

            return res
        }

        // Triggering both functions at the same time but if locking works,
        // the value should be incremented twice
        const t1 = Date.now()
        await Promise.all([increment(), increment()])
        const t2 = Date.now()

        const blockDoc = await MayaDbBlock.findOne({ path: '/test/col1/block1' })

        expect(JSON.parse(blockDoc.data).a).toBe(3)
        expect(t2-t1).toBeGreaterThanOrEqual(4000)
        expect(blockDoc.lockExpiresAt).toBe(-1)
    })
})

// export interface ioClient {
//     acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any>,
//     ensureHierarchy(tree: DatabaseTree, absPath: string): Promise<void>
// }