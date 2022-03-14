import { FileIOClient } from "./io/filesystem/fileio";
import { Collection } from "./storage/collection";
import path from 'path'
import { DatabaseTree } from "./storage/storage";
import { MongoIoClient } from "./io/mongo/mongoIo";

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
