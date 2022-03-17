export type OpTarget = 'BLOCK' | 'COLLECTION'

export type DbOperation = 'readFromBlock'
    | 'writeToBlock'
    | 'createBlock'
    | 'deleteBlock'
    | 'getBlock'
    | 'getAllBlocks'
    | 'createCollection'
    | 'deleteCollection'
    | 'getCollection'
    | 'getAllCollections'
    | 'includesCollection'
    | 'includesBlock'
    | 'acquireLockOnBlock'
    | 'ensureHierarchy'

    | 'releaseLock'

    | 'lockAndGet'
    | 'lockAndUpdate'
    | 'lockAndSet'

export type DbRequest = {
    target?: OpTarget,
    path: string,
    operation: DbOperation,
    data?: any
}