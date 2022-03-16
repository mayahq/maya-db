import axios, { Method } from 'axios'
import { Block } from '../../storage/block'
import { Collection } from '../../storage/collection'
import { RemoteBlock } from '../../storage/remoteBlock'
import { DatabaseTree, StorageBlock, StorageCollection } from '../../storage/storage'
import { AsyncFunction, blockCreateOpts, ioClient } from '../io'
import { DbRequest } from './types'

const DEFAULT_BLOCK_OPTS: blockCreateOpts = {
    encrypted: true,
    strict: false,
    recursive: true
}

export class HttpIoClient implements ioClient {
    apiUrl: string
    auth: any
    
    constructor({ apiUrl, auth }: {
        apiUrl: string,
        auth: any
    }) {
        this.apiUrl = apiUrl
        this.auth = auth
    }

    async _executeOperation(op: DbRequest) {
        const method: Method = 'POST'
        const request = {
            method: method,
            url: this.apiUrl,
            data: op,
            headers: {
                Authorization: {...this.auth}
            }
        }
        return await axios(request)
    }

    async readFromBlock(blockPath: string): Promise<any> {
        const op: DbRequest = { path: blockPath, operation: 'readFromBlock' }
        const response = await this._executeOperation(op)
        return response.data.result
    }

    async writeToBlock(blockPath: string, data: any): Promise<any> {
        const op: DbRequest = {
            path: blockPath,
            operation: 'writeToBlock',
            data: { payload: data }
        }
        const response = await this._executeOperation(op)
        return response.data.result
    }

    async createBlock(blockPath: string, opts: blockCreateOpts = DEFAULT_BLOCK_OPTS): Promise<StorageBlock> {
        const op: DbRequest = {
            path: blockPath,
            operation: 'createBlock',
            data: { opts }
        }
        await this._executeOperation(op)
        return new RemoteBlock({
            absPath: blockPath,
            io: this
        })
    }

    async deleteBlock(blockPath: string): Promise<void> {
        const op: DbRequest = { path: blockPath, operation: 'deleteBlock' }
        await this._executeOperation(op)
    }

    getBlock(absPath: string): StorageBlock {
        return new RemoteBlock({
            absPath, io: this
        })
    }

    async getAllBlocks(absPath: string): Promise<StorageBlock[]> {
        const op: DbRequest = { path: absPath, operation: 'getAllBlocks' }
        const response = await this._executeOperation(op)
        const blockPaths = response.data
        return blockPaths.map((b: any) => new Block({
            absPath: b.absPath,
            io: this
        }))
    }

    async createCollection(absPath: string): Promise<StorageCollection> {
        const op: DbRequest = { path: absPath, operation: 'createCollection' }
        await this._executeOperation(op)
        return new Collection({
            absPath: absPath,
            io: this
        })
    }

    getCollection(absPath: string): StorageCollection {
        return new Collection({
            absPath, io: this
        })
    }

    async getAllCollections(absPath: string): Promise<StorageCollection[]> {
        const op: DbRequest = { path: absPath, operation: 'getAllCollections' }
        const response = await this._executeOperation(op)
        const colPaths = response.data
        return colPaths.map((c: any) => new Collection({
            absPath: c.absPath,
            io: this
        }))
    }

    async deleteCollection(absPath: string): Promise<void> {
        const op: DbRequest = { path: absPath, operation: 'deleteCollection' }
        await this._executeOperation(op)
    }

    async includesCollection(absPath: string): Promise<boolean> {
        const op: DbRequest = { path: absPath, operation: 'includesCollection' }
        const response = await this._executeOperation(op)
        return response.data.result
    }

    async includesBlock(absPath: string): Promise<boolean> {
        const op: DbRequest = { path: absPath, operation: 'includesBlock' }
        const response = await this._executeOperation(op)
        return response.data.result
    }

    async acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any> {
        const lockOp: DbRequest = { path: blockPath, operation: 'acquireLockOnBlock' }
        const response = await this._executeOperation(lockOp)
        const lockId = response.data.lockId
        console.log('lockId', lockId)

        const unlockOp: DbRequest = {
            path: blockPath,
            operation: 'releaseLock',
            data: { lockId }
        }

        const result = await callback()
        await this._executeOperation(unlockOp)
        return result
    }

    async ensureHierarchy(tree: DatabaseTree, absPath: string): Promise<void> {
        const op: DbRequest = { path: absPath, operation: 'ensureHierarchy', data: { tree } }
        await this._executeOperation(op)
    }
}