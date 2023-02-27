//jshint -W033
//jshint -W018
//jshint  esversion: 6
const multicb = require('multicb')
const Reduce = require('flumeview-reduce')
const equal = require('deep-equal')

module.exports = function (db, requestIds) {
  db.use('suuids', Reduce(3, (acc, item) => {
    acc = acc || {}
    if (item.type !== 'suuid') return acc
    const {suuid} = item.data
    delete item.data.suuid
    acc[suuid] = item.data
    return acc
  }))
  
  return function(cb) {
    const done = multicb({pluck: 1, spread: true})
    requestIds(done())
    db.suuids.get(done())
    done((err, response, stored) => {
      if (err) return cb(err)
      // TODO: use deepEqual to detect changes in exisitng entities
      const newItems = response.suuid_index.filter(item => {
        const {suuid} = item
        if (!stored[suuid]) return true
        return !equal(
          Object.assign({}, stored[suuid], {suuid: null}),
          Object.assign({}, item, {suuid: null})
        )
      })
      console.log(newItems.length, 'new suuid entities')
      const toStore = newItems.map( item =>{
        return {
          type: 'suuid',
          data: item
        }
      })
      if (toStore.length == 0) return cb(null)
      db.append(toStore, cb)
    })
  }
}
