import update from 'immutability-helper'

import { AsyncFunction, ioClient } from "../io/io";
import { execGetQuery, execSetQuery } from "./query";
import { SetQueryOpts, StorageBlock } from "./storage";

export class Block implements StorageBlock {
    absPath: string
    io: ioClient

    constructor({ absPath, io }: {
        absPath: string,
        io: ioClient
    }) {
        this.absPath = absPath
        this.io = io
    }

    async get(query: any): Promise<any> {
        const data = await this.io.readFromBlock(this.absPath)
        const result = execGetQuery(data, query)
        return result
    }

    async set(query: any, opts: SetQueryOpts = { overwrite: false }): Promise<any> {
        if (opts.overwrite) {
            await this.io.writeToBlock(this.absPath, query)
            return query
        }

        const data = await this.io.readFromBlock(this.absPath)
        const result = execSetQuery(data, query)
        await this.io.writeToBlock(this.absPath, result)
        return result
    }

    async update(updates: any): Promise<any> {
        const data = await this.io.readFromBlock(this.absPath)
        const result = update(data, updates)
        await this.io.writeToBlock(this.absPath, result)
        return result
    }

    acquireLock(func: AsyncFunction): Promise<any> {
        return this.io.acquireLockOnBlock(this.absPath, func)
    }

    lockAndGet(query: any): Promise<any> {
        return this.io.acquireLockOnBlock(this.absPath, async () => {
            const result = await this.get(query)
            return result
        })
    }

    lockAndSet(query: any, opts: SetQueryOpts = { overwrite: false }): Promise<any> {
        return this.io.acquireLockOnBlock(this.absPath, async () => {
            const result = await this.set(query, opts)
            return result
        })
    }

    lockAndUpdate(updates: any): Promise<any> {
        return this.io.acquireLockOnBlock(this.absPath, async () => {
            const result = await this.update(updates)
            return result
        })
    }
}