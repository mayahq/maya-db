import { FileIOClient } from "./io/fileio";
import { Collection } from "./storage/collection";
import path from 'path'
import { DatabaseTree } from "./storage/storage";

export function localDb({ encryptionKey, root }: {
    encryptionKey: string,
    root: string
}) {
    const client = new FileIOClient({ encryptionKey })
    const db = new Collection({ absPath: root, io: client})
    return db
}
