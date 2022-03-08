import mongoose from 'mongoose'
import { Collection } from '../../storage/collection'
import MayaDbBlock from './blockSchema'
import MayaDbCollection from './collectionSchema'
import { MongoIoClient } from './mongoIo'

const rootCollection = new Collection({
    absPath: '/test',
    io: new MongoIoClient()
})

/**
 * Initial hierarchy - 
 * 
 * test
 * |--col1
 * |--|--block1
 * |--|--block2
 * |--col2
 * |--|--col3
 * |--|--|--block3
 * |--|--|--block4
 * |--|--col4
 */

describe('Mongo I/O Client', () => {

    beforeAll(async () => {
        await mongoose.connect(
            'mongodb://localhost:27017/mayatest'
        )

        await MayaDbCollection.create({ path: '/test/col1' })
        await MayaDbCollection.create({ path: '/test/col2' })
        await MayaDbCollection.create({ path: '/test/col2/col3' })
        await MayaDbCollection.create({ path: '/test/col2/col4' })

        await MayaDbBlock.create({ path: '/test/col1/block1'})
        await MayaDbBlock.create({ path: '/test/col1/block2'})
        await MayaDbBlock.create({ path: '/test/col2/col3/block3'})
        await MayaDbBlock.create({ path: '/test/col2/col3/block4'})
    })

    afterAll(async () => {
        const regexp = `^/test`
        await MayaDbCollection.deleteMany({ path: { $regex: regexp } })
        await MayaDbBlock.deleteMany({ path: { $regex: regexp } })
    })

    test('Creating block works if parent blocks exist', async () => {
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

    test('Creating block works if some parent blocks do not exist', async () => {
        try {
            const block = await rootCollection.createNewBlock('col1/newcol1/newcol2/newblock')
            expect(block.absPath).toBe('/test/col1/newcol1/newcol2/newblock')

            const newcol1Doc = await MayaDbCollection.findOne({ path: '/test/col1/newcol1' })
            expect(newcol1Doc).toBeTruthy()

            const newcol2Doc = await MayaDbCollection.findOne({ path: '/test/col1/newcol2' })
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
            await rootCollection.deleteBlock('col1/block1')
            const blockDoc = await MayaDbBlock.findOne({ path: '/test/col1/block1' })
            expect(blockDoc).toBeFalsy()
        } catch (e: any) {
            console.log(e.message)
            fail('Block deletion failed')
        }
    })

    test('Getting all blocks works', async () => {
        try {
            const blocks = await rootCollection.collection('col2/col3').getAllBlocks()
            const blockPaths = blocks.map(b => b.absPath)
            expect(blocks.length).toBeGreaterThanOrEqual(2)
            expect(blockPaths).toContain('/test/col2/col3/block3')
            expect(blockPaths).toContain('/test/col2/col3/block4')
        } catch (e: any) {
            console.log(e.message)
            fail('Failed to get all blocks')
        }
    })
})

// export interface ioClient {
//     readFromBlock(blockPath: string): Promise<any>,
//     writeToBlock(blockPath: string, data: any): Promise<any>,

//     getAllCollections(absPath: string): Promise<StorageCollection[]>,
//     deleteCollection(absPath: string): Promise<void>,

//     includesCollection(absPath: string): Promise<boolean>,
//     includesBlock(absPath: string): Promise<boolean>,

//     acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any>,
//     ensureHierarchy(tree: DatabaseTree, absPath: string): Promise<void>
// }



async function createBlock() {
    const block = await rootCollection.createNewBlock('col1/col2/block3')
    console.log('Block created:', block)
}

async function deleteBlock() {
    const block = await rootCollection.deleteBlock('col1/col3/block2')
    console.log('Block deleted:', block)
}

async function getAllBlocks() {
    const blocks = await rootCollection.collection('col1/col2').getAllBlocks()
    console.log('All blocks:', blocks)
}

async function createCollection() {
    const collection = await rootCollection.createNewCollection('newcol')
    console.log('New collection:', collection)
}

async function getAllCollections() {
    const collections = await rootCollection.collection('col1').getAllCollections()
    console.log('All collections:', collections)
}

// async function test() {
//     await mongoose.connect(
//         'mongodb://localhost:27017/mayatest'
//     )

//     // await createBlock()
//     // await deleteBlock()
//     // await getAllBlocks()
//     // await createCollection()
//     await getAllCollections()
// }

// test().then(() => process.exit())