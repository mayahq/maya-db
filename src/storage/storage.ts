import { AsyncFunction, blockCreateOpts, ioClient } from "../io/io";

export type SetQueryOpts = {
    overwrite: boolean
}

export type DatabaseTree = {
    [key: string]: DatabaseTree[] | 'BLOCK' | 'ENCRYPTED_BLOCK'
}

export interface StorageBlock {
    absPath: string,
    io: ioClient,
    get(query: any): Promise<any>,
    set(query: any, opts?: SetQueryOpts): Promise<any>,
    update(updates: any): Promise<any>,
    lockAndGet(query: any): Promise<any>,
    lockAndSet(query: any, opts?: SetQueryOpts): Promise<any>,
    lockAndUpdate(updates: any): Promise<any>,
    acquireLock(func: AsyncFunction): Promise<any>
}

export interface StorageCollection {
    absPath: string,
    io: ioClient,
    collection(relativePath: string): StorageCollection,
    block(relativePath: string): StorageBlock,
    getAllCollections(): Promise<StorageCollection[]>,
    getAllBlocks(): Promise<StorageBlock[]>,
    createNewBlock(name: string, opts?: blockCreateOpts): Promise<StorageBlock>,
    createNewCollection(name: string): Promise<StorageCollection>,
    deleteBlock(relativePath: string): Promise<void>,
    deleteCollection(relativePath: string): Promise<void>,
    ensureHierarchy(tree: DatabaseTree): Promise<void>,
    containsBlock(relativePath: string): Promise<boolean>,
    containsCollection(relativePath: string): Promise<boolean>
}