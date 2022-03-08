import path from 'path'
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
        index: true
    }
})

MayaDbCollectionSchema.pre('save', function(next) {
    let parent = path.dirname(this.path)
    if (parent === '.') {
        parent = '/'
    }

    this.parentPath = parent
    next()
})

const MayaDbCollection = mongoose.model('MayaDbCollection', MayaDbCollectionSchema)
export default MayaDbCollection