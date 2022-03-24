import { FileIOClient } from "./io/filesystem/fileio";
import { Collection } from "./storage/collection";
import path from 'path'
import { DatabaseTree } from "./storage/storage";
import { MongoIoClient } from "./io/mongo/mongoIo";
import { HttpIoClient } from "./io/http/http";

export function localDb({ encryptionKey, root }: {
    encryptionKey: string,
    root: string
}) {
    const client = new FileIOClient({ encryptionKey })
    const db = new Collection({ absPath: root, io: client})
    return db
}

export function mongoDbAdapter({ root }: { root: string }) {
    const client = new MongoIoClient()
    const db = new Collection({ absPath: root, io: client})
    return db
}

export function httpAdapter({ apiUrl, root, headers }: { 
    apiUrl: string, root: string, headers: any 
}) {
    const io = new HttpIoClient({
        apiUrl, headers
    })
    const db = new Collection({ absPath: root, io: io })
    return db
}