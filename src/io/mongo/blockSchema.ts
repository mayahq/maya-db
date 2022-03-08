import mongoose from 'mongoose'
import path from 'path'

const MayaDbBlockSchema = new mongoose.Schema({
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

const MayaDbBlock = mongoose.model('MayaDbBlock', MayaDbBlockSchema)

export default MayaDbBlock