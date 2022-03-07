import path from 'path'

import { blockCreateOpts, ioClient } from "../io/io";
import { StorageCollection, StorageBlock, DatabaseTree } from "./storage";

const DEFAULT_BLOCK_OPTS: blockCreateOpts = {
    encrypted: true,
    strict: false,
    recursive: true
}


export class Collection implements StorageCollection {
    absPath: string
    io: ioClient

    constructor({ absPath, io }: {
        absPath: string,
        io: ioClient
    }) {
        this.absPath = absPath
        this.io = io
    }

    async ensureHierarchy(tree: DatabaseTree) {
        return await this.io.ensureHierarchy(tree, this.absPath)
    }

    collection(relativePath: string): StorageCollection {
        const childPath = path.join(this.absPath, relativePath)
        return this.io.getCollection(childPath)
    }

    async getAllCollections(): Promise<StorageCollection[]> {
        return await this.io.getAllCollections(this.absPath)
    }

    block(relativePath: string): StorageBlock {
        const childPath = path.join(this.absPath, relativePath)
        return this.io.getBlock(childPath)
    }

    async getAllBlocks(): Promise<StorageBlock[]> {
        return await this.io.getAllBlocks(this.absPath)
    }

    containsBlock(relativePath: string): Promise<boolean> {
        return this.io.includesBlock(
            path.join(this.absPath, relativePath)
        )
    }

    containsCollection(relativePath: string): Promise<boolean> {
        return this.io.includesCollection(
            path.join(this.absPath, relativePath)
        )
    }

    async createNewBlock(name: string, opts = DEFAULT_BLOCK_OPTS): Promise<StorageBlock> {
        const childPath = path.join(this.absPath, name)
        return await this.io.createBlock(childPath, opts)
    }

    createNewCollection(name: string): Promise<StorageCollection> {
        const childPath = path.join(this.absPath, name)
        return this.io.createCollection(childPath)
    }

    deleteBlock(relativePath: string): Promise<void> {
        const childPath = path.join(this.absPath, relativePath)
        return this.io.deleteBlock(childPath)
    }

    deleteCollection(relativePath: string): Promise<void> {
        const childPath = path.join(this.absPath, relativePath)
        return this.io.deleteCollection(childPath)
    }
}