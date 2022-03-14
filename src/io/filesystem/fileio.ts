import fs from 'fs'
import path from 'path'
import lockFile from 'lockfile'

import { Block } from '../../storage/block';
import { Collection } from '../../storage/collection';
import { StorageBlock, StorageCollection, DatabaseTree } from '../../storage/storage';
import { decrypt, encrypt } from './encrypt';
import { AsyncFunction, blockCreateOpts, ioClient } from "../io";

function getFileNameWithoutExtension(filename: string) {
    let parts = filename.split('.')
    parts = parts.slice(0, parts.length-1)
    return parts.join('.')
}


export class FileIOClient implements ioClient {
    encryptionKey: string
    
    constructor({ encryptionKey }: {
        encryptionKey: string
    }) {
        this.encryptionKey = encryptionKey
    }

    async ensureHierarchy(tree: DatabaseTree, absPath: string) {
        for (const [key, val] of Object.entries(tree)) {
            if (Array.isArray(val)) {
                const dirPath = path.join(absPath, key)
                if (!(await this.includesCollection(dirPath))) {
                    try {
                        fs.mkdirSync(dirPath, { recursive: true })
                    } catch (e: any) {
                        if (!e.message.includes('EEXIST')) {
                            throw e
                        }
                    }
                }
                for (const subtree of val) {
                    this.ensureHierarchy(subtree, dirPath)
                }
            }
            else if (val === 'BLOCK' || val === 'ENCRYPTED_BLOCK') {
                const shouldBeEncrypted = val.includes('ENCRYPTED')
                const blockPath = path.join(absPath, key)

                if (await this.includesBlock(blockPath)) {
                    const block = JSON.parse(
                        fs.readFileSync(`${blockPath}.json`).toString()
                    )
                    // console.log('FILE CONTENT:', blockPath, read)
                    // const block = require(`${blockPath}.json`)
                    if (block.__meta.encrypted !== shouldBeEncrypted) {
                        const err = new Error(`Encryption constraint failed for block at ${path.join(absPath, key)}`)
                        err.name = 'FAILED_TO_ENSURE_HIERARCHY'
                        throw err
                    }
                } else {
                    this.createBlock(blockPath, { encrypted: shouldBeEncrypted, strict: false, recursive: false })
                }
            }
            else {
                throw new Error(`Invalid database hierarchy specification at path: ${path.join(absPath, key)}`)
            }
        }
    }

    async validateBlockPath(blockPath: string) {
        if (!fs.existsSync(`${blockPath}.json`)) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }
    }

    async validateCollectionPath(absPath: string) {
        if (!fs.existsSync(absPath) || !fs.lstatSync(absPath).isDirectory()) {
            const err = new Error(`No collection exists at path: ${absPath}`)
            err.name = 'COLLECTION_NOT_FOUND'
            throw err
        }
    }

    async includesCollection(absPath: string): Promise<boolean> {
        try {
            await this.validateCollectionPath(absPath)
            return true
        } catch (e) {
            return false
        }
    }

    async includesBlock(blockPath: string): Promise<boolean> {
        try {
            await this.validateBlockPath(blockPath)
            return true
        } catch (e) {
            return false
        }
    }
    
    async readFromBlock(blockPath: string): Promise<any> {
        await this.validateBlockPath(blockPath)

        // const blockContent = require(`${blockPath}.json`)
        const blockContent = JSON.parse(
            fs.readFileSync(`${blockPath}.json`).toString()
        )

        const encrypted = blockContent.__meta.encrypted
        if (encrypted) {
            const iv = blockContent.__meta.iv
            if (!iv) {
                return {}
            }

            const data = decrypt(blockContent.__data, this.encryptionKey, iv)
            return JSON.parse(data)
        } else {
            return blockContent.__data
        }
    }

    async writeToBlock(blockPath: string, data: any): Promise<any> {
        await this.validateBlockPath(blockPath)

        // const blockContent = require(`${blockPath}.json`)
        const blockContent = JSON.parse(
            fs.readFileSync(`${blockPath}.json`).toString()
        )
        const encrypted = blockContent.__meta.encrypted
        if (encrypted) {
            const { encryptedData, iv } = encrypt(JSON.stringify(data), this.encryptionKey)
            blockContent.__data = encryptedData
            blockContent.__meta.iv = iv
        } else {
            blockContent.__data = data
        }

        fs.writeFileSync(`${blockPath}.json`, JSON.stringify(blockContent, null, 2))
    }

    async acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any> {
        await this.validateBlockPath(blockPath)
        return await new Promise((resolve, reject) => {
            lockFile.lock(`${blockPath}.lock`, {wait: 60000, stale: 20000}, async (err) => {
                if (err) {
                    return reject(err)
                }
    
                try {
                    const result = await callback()
                    // setTimeout(() => lockFile.unlock(path), 10000)
                    lockFile.unlock(`${blockPath}.lock`, () => null)
                    return resolve(result)
                } catch (e) {
                    lockFile.unlock(`${blockPath}.lock`, () => null)
                    return reject(e)
                }
            })
        })
    }

    async createBlock(blockPath: string, opts: blockCreateOpts): Promise<StorageBlock> {
        if (fs.existsSync(`${blockPath}.json`)) {
            if (opts.strict) {
                const err = new Error(`Block already exists at path: ${blockPath}.json`)
                err.name = 'BLOCK_ALREADY_EXISTS'
                throw err
            }
            const block = this.getBlock(blockPath)
            return block
        }
        
        const dir = path.dirname(blockPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        } else {
            const fileExists = !fs.lstatSync(dir).isDirectory()
            if (fileExists) {
                const err = new Error(`Invalid path: ${dir} already exists and is not a directory`)
                err.name = 'INVALID_PATH'
                throw err
            }
        }

        const content = {
            __meta: opts,
            __data: opts.encrypted ? '' : {}
        }
        
        fs.writeFileSync(`${blockPath}.json`, JSON.stringify(content, null, 2))
        const block = new Block({ absPath: blockPath, io: this })
        return block
    }

    async deleteBlock(blockPath: string) {
        await this.validateBlockPath(blockPath)
        fs.unlinkSync(`${blockPath}.json`)
    }

    getBlock(blockPath: string): StorageBlock {
        const block = new Block({ absPath: blockPath, io: this })
        return block
    }

    async getAllBlocks(absPath: string): Promise<StorageBlock[]> {
        await this.validateCollectionPath(absPath)
        const blocks = fs.readdirSync(absPath, { withFileTypes: true })
            .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
            .map((dirent) => new Block({
                io: this,
                absPath: path.join(absPath, getFileNameWithoutExtension(dirent.name))
            }))

        return blocks
    }

    async createCollection(absPath: string): Promise<StorageCollection> {
        fs.mkdirSync(absPath, { recursive: true })
        const collection = new Collection({ absPath: absPath, io: this })
        return collection
    }

    getCollection(absPath: string): StorageCollection {
        const collection = new Collection({ absPath: absPath, io: this })
        return collection
    }

    async getAllCollections(absPath: string): Promise<StorageCollection[]> {
        await this.validateCollectionPath(absPath)

        const collections = fs.readdirSync(absPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => new Collection({
                absPath: path.join(absPath, dirent.name),
                io: this
            }))
        
        return collections
    }

    async deleteCollection(absPath: string) {
        await this.validateCollectionPath(absPath)
        fs.rmSync(absPath, { recursive: true, force: true })
    }
}