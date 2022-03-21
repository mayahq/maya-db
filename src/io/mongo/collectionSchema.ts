import path from 'path'
import mongoose from 'mongoose'

interface CollectionDoc extends mongoose.Document {
    path: string,
    parentPath: string
}

export const MayaDbCollectionSchema = new mongoose.Schema<CollectionDoc>({
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

const MayaDbCollection = mongoose.model<CollectionDoc>('MayaDbCollection', MayaDbCollectionSchema)
export default MayaDbCollection