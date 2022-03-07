import mongoose from 'mongoose'
import path from 'path'

const MayaDbCollectionSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MayaDbCollection',
        index: true
    }
})

const MayaDbCollection = mongoose.model('MayaDbCollection', MayaDbCollectionSchema)
export default MayaDbCollection