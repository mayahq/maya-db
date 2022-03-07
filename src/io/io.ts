import { DatabaseTree, StorageBlock, StorageCollection } from "../storage/storage";

export interface blockCreateOpts {
    encrypted: boolean,
    strict: boolean,
    recursive: boolean
}

export type AsyncFunction = (...args: any) => Promise<any>

export interface ioClient {
    readFromBlock(blockPath: string): Promise<any>,
    writeToBlock(blockPath: string, data: any): Promise<any>,
    
    createBlock(blockPath: string, opts: blockCreateOpts): Promise<StorageBlock>,
    deleteBlock(blockPath: string): Promise<void>,
    getBlock(absPath: string): StorageBlock
    getAllBlocks(absPath: string): Promise<StorageBlock[]>,
    
    createCollection(absPath: string): Promise<StorageCollection>,
    getCollection(absPath: string): StorageCollection,
    getAllCollections(absPath: string): Promise<StorageCollection[]>,
    deleteCollection(absPath: string): Promise<void>,

    includesCollection(absPath: string): Promise<boolean>,
    includesBlock(absPath: string): Promise<boolean>,

    acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any>,
    ensureHierarchy(tree: DatabaseTree, absPath: string): Promise<void>
}