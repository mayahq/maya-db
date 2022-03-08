import path from 'path'
import MayaDbCollection from './collectionSchema'

export function getAllParentPaths(absPath: string): string[] {
    let dirNames = absPath.split('/').filter(r => r.length !== 0)
    let currPath = dirNames[0]
    const result: string[] = [currPath]

    for (let i = 1; i < dirNames.length; i++) {
        currPath = path.join('/', currPath, dirNames[i])
        result.push(currPath)
    }

    result.pop()
    return result
}

export function createCollectionsForAllParentPaths(blockPath: string): Promise<any> {
    const parentPaths = getAllParentPaths(blockPath)
    const promises = parentPaths.map(colPath => new Promise((resolve, reject) => {
        MayaDbCollection.create({ path: normalizePath(colPath) })
            .then(res => resolve(res))
            .catch(e => {
                if (e.code === 11000) { // Duplicate key error. Means that the collection already exists
                    resolve({})
                } else {
                    reject(e)
                }
            })
    }))

    return Promise.all(promises)
}

export function normalizePath(absPath: string): string {
    return path.join('/', absPath)
}