import path from 'path'
import mongoose from 'mongoose'

import { AsyncFunction, blockCreateOpts, ioClient } from "../io";
import { DatabaseTree, StorageBlock, StorageCollection } from "../../storage/storage";
import MayaDbBlock from "./blockSchema";
import { Block } from "../../storage/block";
import { Collection } from "../../storage/collection";
import MayaDbCollection from "./collectionSchema";
import Lock from "./lock";
import { createCollectionsForAllParentPaths, getAllParentPaths, normalizePath } from './util';

export class MongoIoClient implements ioClient {
    lock: Lock

    constructor() {
        this.lock = new Lock()
    }

    async readFromBlock(blockPath: string): Promise<any> {
        const block = await MayaDbBlock.findOne({ path: blockPath })
        if (!block) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }

        return JSON.parse(block.data)
    }

    async writeToBlock(blockPath: string, data: any): Promise<any> {
        blockPath = normalizePath(blockPath)

        const block = await MayaDbBlock.findOneAndUpdate({ path: blockPath }, {
            $set: { data: JSON.stringify(data) }
        })

        if (!block) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }
    }

    async createBlock(blockPath: string, opts: blockCreateOpts): Promise<StorageBlock> {
        blockPath = normalizePath(blockPath)

        const session = await mongoose.startSession()
        await session.withTransaction(async () => {
            const col = await MayaDbCollection.findOne({ path: path.dirname(blockPath) })
            if (!col) {
                if (opts.recursive) {
                    await createCollectionsForAllParentPaths(blockPath)
                } else {
                    const err = new Error('Parent collection does not exist')
                    err.name = 'PARENT_COLLECTION_NOT_FOUND'
                    throw err
                }
            }
            try {
                await MayaDbBlock.create({ path: blockPath })
            } catch (e: any) {
                console.log('Real error creating block:', e)
                if (e.code !== 11000) {
                    throw e
                }
    
                if (opts.strict) {
                    const err = new Error(`Block already exists at path: ${blockPath}.json`)
                    err.name = 'BLOCK_ALREADY_EXISTS'
                    throw err
                }
            }
        })

        session.endSession()

        const block = this.getBlock(blockPath)
        return block
    }

    async deleteBlock(blockPath: string): Promise<void> {
        blockPath = normalizePath(blockPath)

        const block = await MayaDbBlock.findOneAndDelete({ path: blockPath })
        if (!block) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }
    }

    getBlock(absPath: string): StorageBlock {
        absPath = normalizePath(absPath)

        const block = new Block({ absPath: absPath, io: this })
        return block
    }

    async getAllBlocks(absPath: string): Promise<StorageBlock[]> {
        absPath = normalizePath(absPath)

        const blocks = await MayaDbBlock.find({ parentPath: absPath })
        return blocks.map(b => new Block({ absPath: b.path, io: this }))
    }

    async createCollection(absPath: string): Promise<StorageCollection> {
        absPath = normalizePath(absPath)

        const block = await MayaDbBlock.findOne({ path: absPath })
        if (block) {
            const err: any = new Error('Block with this path already exists')
            err.code = 'BLOCK_ALREADY_EXISTS'
            throw err
        }

        // Make sure all parent collections exist and then create this one.
        const session = await mongoose.startSession()
        await session.withTransaction(async () => {
            await createCollectionsForAllParentPaths(absPath)
            await MayaDbCollection.create({ path: absPath })
        })

        const collection = new Collection({ absPath: absPath, io: this })
        return collection
    }

    getCollection(absPath: string): StorageCollection {
        absPath = normalizePath(absPath)
        return new Collection({ absPath: absPath, io: this })
    }

    async getAllCollections(absPath: string): Promise<StorageCollection[]> {
        absPath = normalizePath(absPath)
        const cols = await MayaDbCollection.find({ parentPath: absPath })
        return cols.map(c => new Collection({ absPath: c.path, io: this }))
    }

    // TODO: Delete all blocks that the collection contains
    async deleteCollection(absPath: string): Promise<void> {
        absPath = normalizePath(absPath)
        const col = await MayaDbCollection.findOneAndDelete({ path: absPath })
        if (!col) {
            const err = new Error(`No collection exists at path ${absPath}`)
            err.name = 'COLLECTION_NOT_FOUND'
            throw err
        }
    }

    async includesCollection(absPath: string): Promise<boolean> {
        absPath = normalizePath(absPath)
        const col = await MayaDbCollection.findOne({ path: absPath })
        if (!col) {
            return false
        }
        return true
    }

    async includesBlock(absPath: string): Promise<boolean> {
        absPath = normalizePath(absPath)
        const block = await MayaDbBlock.findOne({ path: absPath })
        if (!block) {
            return false
        }
        return true
    }

    acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any> {
        blockPath = normalizePath(blockPath)
        return new Promise((resolve, reject) => {
            this.lock.acquire(blockPath, async (e: Error, releaseLock: Function, lockDocument: any) => {
                if (e) {
                    console.log(`Error acquiring lock on ${blockPath}`, e)
                    await releaseLock()
                    return reject(e)
                }
                
                try {
                    const res = await callback(lockDocument)
                    await releaseLock()
                    return resolve(res)
                } catch (e) {
                    console.log(`Error acquiring lock on ${blockPath}`, e)
                    await releaseLock()
                    return reject(e)
                }
            })
        })
    }

    async ensureHierarchy(tree: DatabaseTree, absPath: string): Promise<void> {
        absPath = normalizePath(absPath)
        for (const [key, val] of Object.entries(tree)) {
            if (Array.isArray(val)) {
                const dirPath = path.join(absPath, key)
                if (!(await this.includesCollection(dirPath))) { // Check if collection not included
                    try {
                        await this.createCollection(dirPath) // Create new if its not
                    } catch (e: any) {
                        console.log('Error creating new collection:', dirPath, e)
                        throw e
                    }
                }
                for (const subtree of val) {
                    this.ensureHierarchy(subtree, dirPath) // Hehe, go recursive
                }
            }
            else if (typeof val === 'string') {
                const shouldBeEncrypted = true
                const blockPath = path.join(absPath, key) // Calculate block path

                if (!(await this.includesBlock(blockPath))) { // Create block if not included
                    this.createBlock(blockPath, { encrypted: shouldBeEncrypted, strict: false, recursive: false })
                }
            }
            else {
                throw new Error(`Invalid database hierarchy specification at path: ${path.join(absPath, key)}`)
            }
        }
    }
}