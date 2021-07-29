import { StorageBlock, StorageCollection } from "../storage/storage";

export interface blockCreateOpts {
    encrypted: boolean
}

export type AsyncFunction = (...args: any) => Promise<any>

export interface ioClient {
    readFromBlock(blockPath: string): Promise<any>,
    writeToBlock(blockPath: string, data: any): Promise<any>,
    
    createBlock(blockPath: string, opts: blockCreateOpts): StorageBlock,
    deleteBlock(blockPath: string): void,
    getBlock(absPath: string): StorageBlock
    getAllBlocks(absPath: string): StorageBlock[],
    
    createCollection(absPath: string): StorageCollection,
    getCollection(absPath: string): StorageCollection,
    getAllCollections(absPath: string): StorageCollection[],
    deleteCollection(absPath: string): void,

    acquireLockOnBlock(blockPath: string, callback: AsyncFunction): Promise<any>
}