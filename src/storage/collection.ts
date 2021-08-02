import path from 'path'

import { blockCreateOpts, ioClient } from "../io/io";
import { StorageCollection, StorageBlock, DatabaseTree } from "./storage";

const DEFAULT_BLOCK_OPTS: blockCreateOpts = {
    encrypted: true,
    strict: false
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

    ensureHierarchy(tree: DatabaseTree) {
        return this.io.ensureHierarchy(tree, this.absPath)
    }

    collection(relativePath: string): StorageCollection {
        const childPath = path.join(this.absPath, relativePath)
        return this.io.getCollection(childPath)
    }

    getAllCollections(): StorageCollection[] {
        return this.io.getAllCollections(this.absPath)
    }

    block(relativePath: string): StorageBlock {
        const childPath = path.join(this.absPath, relativePath)
        return this.io.getBlock(childPath)
    }

    getAllBlocks(): StorageBlock[] {
        return this.io.getAllBlocks(this.absPath)
    }

    createNewBlock(name: string, opts = DEFAULT_BLOCK_OPTS): StorageBlock {
        const childPath = path.join(this.absPath, name)
        return this.io.createBlock(childPath, opts)
    }

    createNewCollection(name: string): StorageCollection {
        const childPath = path.join(this.absPath, name)
        return this.io.createCollection(childPath)
    }

    deleteBlock(relativePath: string) {
        const childPath = path.join(this.absPath, relativePath)
        this.io.deleteBlock(childPath)
    }

    deleteCollection(relativePath: string) {
        const childPath = path.join(this.absPath, relativePath)
        this.io.deleteCollection(childPath)
    }
}