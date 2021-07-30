import path from 'path'
import { localDb } from './index'
import { DatabaseTree } from './storage/storage'

const dbroot = path.resolve((<any>process.env).HOME, 'maya/testdb1')
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

const tree: DatabaseTree = {
    tokens: [
        {
            safe: [
                {
                    spotify: 'BLOCK',
                },
                {
                    google: 'ENCRYPTED_BLOCK',
                },
                {
                    testcol: []
                }
            ]
        },
        {
            unsafe: [
                {
                    spotify: 'ENCRYPTED_BLOCK',
                },
                {
                    testcol: []
                }
            ]
        }
    ],
    global: 'BLOCK'
}

// console.log(db.collection('global').getAllBlocks())
db.ensureHierarchy(tree)

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
