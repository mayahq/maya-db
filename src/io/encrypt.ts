import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

export function encrypt(text: string, key: string) {
const bufkey = Buffer.from(key, 'hex')
const iv = crypto.randomBytes(16)
const cipher = crypto.createCipheriv(ALGORITHM, bufkey, iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([ encrypted, cipher.final()])
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    }
}

export function decrypt(encryptedText: string, key: string, iv: string) {
    const bufkey = Buffer.from(key, 'hex')
    const encryptedData = Buffer.from(encryptedText, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, bufkey, Buffer.from(iv, 'hex'))
    let decrypted = decipher.update(encryptedData)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}

export function generateSecretKey(): string {
    const newKey = crypto.randomBytes(32).toString('hex')
    return newKey
}