import mongoose from 'mongoose'
import dotenv from 'dotenv'

beforeAll(async () => {
    dotenv.config()

    // await mongoose.connect(
    //     'mongodb://localhost:27017/mayatest'
    // )

    const db = {
        user: process.env.MONGO_USERNAME,
        password: process.env.MONGO_PASSWORD,
        host: process.env.MONGO_HOST,
        database: process.env.MONGO_NAME
    }

    // const connectionString = `mongodb+srv://${db.user}:${db.password}@${db.host}/${db.database}`
    const connectionString = 'mongodb://localhost:27017/mayatest'

    await mongoose.connect(connectionString, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        }
    )
})

afterAll(async () => {
    await mongoose.connection.close()
})