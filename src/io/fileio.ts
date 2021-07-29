import fs from 'fs'
import path from 'path'
import lockFile from 'lockfile'

import { Block } from '../storage/block';
import { Collection } from '../storage/collection';
import { StorageBlock, StorageCollection } from '../storage/storage';
import { decrypt, encrypt } from './encrypt';
import { AsyncFunction, blockCreateOpts, ioClient } from "./io";

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

    validateBlockPath(blockPath: string) {
        if (!fs.existsSync(`${blockPath}.json`)) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }
    }
    
    async readFromBlock(blockPath: string): Promise<any> {
        this.validateBlockPath(blockPath)

        const blockContent = require(`${blockPath}.json`)
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
        this.validateBlockPath(blockPath)

        const blockContent = require(`${blockPath}.json`)
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

    acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any> {
        this.validateBlockPath(blockPath)
        return new Promise((resolve, reject) => {
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

    createBlock(blockPath: string, opts: blockCreateOpts): StorageBlock {
        if (fs.existsSync(`${blockPath}.json`)) {
            const err = new Error(`Block already exists at path: ${blockPath}.json`)
            err.name = 'BLOCK_ALREADY_EXISTS'
            throw err
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

    deleteBlock(blockPath: string) {
        this.validateBlockPath(blockPath)
        fs.unlinkSync(`${blockPath}.json`)
    }

    getBlock(blockPath: string): StorageBlock {
        this.validateBlockPath(blockPath)
        const block = new Block({ absPath: blockPath, io: this })
        return block
    }

    getAllBlocks(absPath: string): StorageBlock[] {
        if (!fs.existsSync(absPath) || !fs.lstatSync(absPath).isDirectory()) {
            const err = new Error(`Invalid path: ${absPath} is not a directory`)
            err.name = 'INVALID_PATH'
            throw err
        }

        const blocks = fs.readdirSync(absPath, { withFileTypes: true })
            .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
            .map((dirent) => new Block({
                io: this,
                absPath: path.join(absPath, getFileNameWithoutExtension(dirent.name))
            }))

        return blocks
    }

    createCollection(absPath: string): StorageCollection {
        fs.mkdirSync(absPath, { recursive: true })
        const collection = new Collection({ absPath: absPath, io: this })
        return collection
    }

    getCollection(absPath: string): StorageCollection {
        if (!fs.existsSync(absPath) || !fs.lstatSync(absPath).isDirectory()) {
            const err = new Error(`No collection exists at path: ${absPath}`)
            err.name = 'COLLECTION_NOT_FOUND'
            throw err
        }

        const collection = new Collection ({ absPath: absPath, io: this })
        return collection
    }

    getAllCollections(absPath: string): StorageCollection[] {
        if (!fs.existsSync(absPath) || !fs.lstatSync(absPath).isDirectory()) {
            const err = new Error(`Invalid path: ${absPath} is not a directory`)
            err.name = 'INVALID_PATH'
            throw err
        }

        const collections = fs.readdirSync(absPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => new Collection({
                absPath: path.join(absPath, dirent.name),
                io: this
            }))
        
        return collections
    }

    deleteCollection(absPath: string) {
        if (!fs.existsSync(absPath) || !fs.lstatSync(absPath).isDirectory()) {
            const err = new Error(`No collection found at ${absPath}`)
            err.name = 'COLLECTION_NOT_FOUND'
            throw err
        }

        fs.rmSync(absPath, { recursive: true, force: true })
    }
}