import mongoose from 'mongoose'

const MayaDbCollectionSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    parentPath: {
        type: String,
        required: true,
        index: true
    }
})

const MayaDbCollection = mongoose.model('MayaDbCollection', MayaDbCollectionSchema)
export default MayaDbCollection