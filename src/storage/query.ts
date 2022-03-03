export function execGetQuery(targetJson: any, query: any) {
    // console.log('query', query)
    // console.log('target', targetJson)
    const result: any = {}

    if (Object.keys(query).length === 0) {
        return targetJson
    }

    Object.entries(query).forEach(([key, val]) => {
        if (targetJson[key] === undefined) {
            result[key] = val
            return
        }

        if (typeof val === 'object' && val !== null && val !== undefined) {
            result[key] = execGetQuery(targetJson[key], val)
            return
        }

        result[key] = targetJson[key]
    })

    return result
}

export function execSetQuery(targetJson: any, query: any) {
    Object.entries(query).forEach(([key, val]) => {
        if (targetJson[key] === undefined) {
            targetJson[key] = val
            return
        }

        if (typeof val === 'object' && !Array.isArray(val)) {
            execSetQuery(targetJson[key], val)
            return
        }

        targetJson[key] = val
    })

    return targetJson
}