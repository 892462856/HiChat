const CommonCacheAccessor = function (cache) {
    this._cache = cache
}
CommonCacheAccessor.prototype = {
    get(key, dataAccessorPromiseFunc) {
        const value = JSON.parse(this._cache.getItem(key))

        if (dataAccessorPromiseFunc) {
            if (value === null || value === undefined || (value.constructor === Array && value.length === 0)) {
                return dataAccessorPromiseFunc().then(data => {
                    this.set(key, data)
                    return data
                })
            } else {
                return Promise.resolve(value)
            }
        }
        return value
    },
    set(key, data) {
        if (data === null || data === undefined) {
            this._cache.removeItem(key)
        } else {
            this._cache.setItem(key, JSON.stringify(data))
        }
        return Promise.resolve(data)
    }
}

export default CommonCacheAccessor
