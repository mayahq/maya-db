import { FileIOClient } from "./io/fileio";
import { Collection } from "./storage/collection";
import path from 'path'

export function localDb({ encryptionKey, root }: {
    encryptionKey: string,
    root: string
}) {
    const client = new FileIOClient({ encryptionKey })
    const db = new Collection({ absPath: root, io: client})
    return db
}


const dbroot = path.resolve((<any>process.env).HOME, 'maya/testdb')
const db = localDb({
    encryptionKey: 'eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a',
    root: dbroot
})

const targetJson = {
    name: 'Dushyant',
    education: {
        college: 'BITS Pilani',
        graduation: 2022,
        degree: {
            type: 'single',
            branch: 'CS'
        }
    },
    address: 'C-154 HKM Nagar'
}

console.log(db.collection('global').getAllBlocks())

// const block = db.createNewCollection('global').createNewBlock('spotify', {encrypted: false})
// const block = db.block('global/spotify')
// const block = db.collection('global').block('spotify')
// block.set(targetJson, {
//     overwrite: true
// })

// const result = block.get({
//     name: null,
//     lastName: 'Jain',
//     education: {
//         college: null,
//         degreeType: 'single'
//     }
// }).then((result) => {
//     console.log(result)
// })
