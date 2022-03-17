import update from 'immutability-helper'

import { AsyncFunction, ioClient } from "../../io/io";
import { SetQueryOpts, StorageBlock } from "../storage";
import { execGetQuery, execSetQuery } from "../query";
import { HttpIoClient } from '../../io/http/http';

export class RemoteBlock implements StorageBlock {
    absPath: string
    io: HttpIoClient

    constructor({ absPath, io }: {
        absPath: string,
        io: HttpIoClient
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

    async lockAndGet(query: any): Promise<any> {
        const result = await this.io._lockAndGet(this.absPath, query)
        return result
    }

    async lockAndSet(query: any, opts?: SetQueryOpts): Promise<any> {
        const result = await this.io._lockAndSet(this.absPath, query, opts)
        return result
    }

    async lockAndUpdate(updates: any): Promise<any> {
        const result = await this.io._lockAndUpdate(this.absPath, updates)
        return result
    }

    async acquireLock(func: AsyncFunction): Promise<any> {
        return this.io.acquireLockOnBlock(this.absPath, func)
    }
}