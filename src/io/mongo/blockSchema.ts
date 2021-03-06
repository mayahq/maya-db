import mongoose from 'mongoose'
import path from 'path'

interface BlockDoc extends mongoose.Document {
    path: string,
    parentPath: string,
    lockAcquiredBy: string,
    lockExpiresAt: number,
    data: string
}

export const MayaDbBlockSchema = new mongoose.Schema<BlockDoc>({
    path: {
        type: String,
        unique: true,
        required: true,
        immutable: true,
        index: true
    },
    parentPath: {
        type: String,
        index: true
    },
    lockAcquiredBy: {
        type: String,
        default: ''
    },
    lockExpiresAt: {
        type: Number,
        default: -1
    },
    data: {
        type: String,
        default: '{}',
        validate: {
            validator: function(v: string) {
                try {
                    JSON.stringify(v)
                    return true
                } catch (e) {
                    return false
                }
            },
            message: () => 'Data must be specified in JSON format'
        }
    }
})

MayaDbBlockSchema.pre('save', function(next) {
    let parent = path.dirname(this.path)
    if (parent === '.') {
        parent = '/'
    }

    this.parentPath = parent
    next()
})

// Don't recompile model if already compiled
const MayaDbBlock = mongoose.models.MayaDbBlock as mongoose.Model<BlockDoc>
    || mongoose.model<BlockDoc>('MayaDbBlock', MayaDbBlockSchema)

export default MayaDbBlock