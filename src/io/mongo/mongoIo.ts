import { blockCreateOpts, ioClient } from "../io";
import { Connection } from 'mongoose'
import Lock from "./lock";
import { StorageBlock } from "../../storage/storage";
import MayaDbDataSchema from "./dataSchema";

export class MongoIoClient implements ioClient {
    mongoConnection: Connection
    lock: Lock
    blockModel: Model

    constructor({
        connection,
    }: {
        connection: Connection,
    }) {
        this.mongoConnection = connection
        this.blockModel = this.mongoConnection.model('MayaDbBlock', MayaDbDataSchema)
    }

    async readFromBlock(blockPath: string): Promise<any> {
        const block = 1
        if (!block) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }

        // return JSON.parse(block.data)
    }

    async writeToBlock(blockPath: string, data: any): Promise<any> {
        const block = 1

        if (!block) {
            const err = new Error(`No block exists at path ${blockPath}`)
            err.name = 'BLOCK_NOT_FOUND'
            throw err
        }
    }

    async createBlock(blockPath: string, opts: blockCreateOpts): Promise<StorageBlock> {
        
    }
}