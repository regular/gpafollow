//jshint -W033
//jshint -W018
//jshint  esversion: 6
const pull = require('pull-stream')
const defer = require('pull-defer')
const { DateTime } = require('luxon')
const { inspect } = require('util')

const interval = require('./interval')
const query = require('./ql')
const ResolveIds = require('./resolve')

module.exports = function(conf) {
  conf = conf || {}
  if (!conf.apitoken) return pull.error('no apitoken configured')
  if (!conf.endpoint) return pull.error('no endpoint configured')
  if (!conf.resolve_endpoint) return pull.error('no resolve_endpoint configured')

  const {through, schema} = query(conf.apitoken, conf.endpoint)
  const getIds = ResolveIds(conf.apitoken, conf.resolve_endpoint)

  const dt_max = DateTime.now().setZone(conf.tz).minus(conf.minage)
  const dt_start = conf.continuation ?
    DateTime.fromSeconds(conf.continuation / 1000).setZone(conf.tz) :    
    DateTime.fromISO(conf.startday).setZone(conf.tz).startOf('day')
  const dt_end = DateTime.min(dt_max, dt_start.plus({days: 2}).endOf('day'))

  if ( !(dt_start < dt_max) ) return pull.error(
    `startday needs to be ${JSON.stringify(conf.minage)} in the past, but it is ${formatDateTime(dt_start)}`
  )

  const deferred = defer.source()

  schema((err, data)=>{
    if (err) return deferred.resolve(pull.error(err))

    const types = typesFromSchema(data.__schema.types)
    const queries = queriesFromSchema(data.__schema.queryType.fields)
    const query = makeGQLQuery(queries, types, {
      timestamp_gte: '$tsgte',
      timestamp_lte: '$tslte',
    })
    //console.log(query)
    deferred.resolve(stream(query))
  })
  deferred.getIds = getIds
  return deferred

  function typesFromSchema(types) {
    return types.reduce( (acc, type)=>{
      const {name, fields} = type
      acc[name] = (fields || []).map( ({name})=> conf.blacklist.includes(name) ? null : name ).filter(x=>x)
      return acc
    }, {})
  }

  function stream(query) {
    //console.log(query)
    return pull(
      interval(dt_start, dt_end, dt_max),
      pull.through( ({start, end})=>{
        //console.error(`Requesting from ${formatDateTime(start)} to ${formatDateTime(end)}`)
      }),
      through(query),
      pull.asyncMap( (_,cb)=>{
        setTimeout( ()=>cb(null, _), conf.rqdelay)
      }),
      pull.map( (data, cb)=>{
        //console.log(data)
        const keys = Object.keys(data).filter(x=>x!='__since').concat('__since')
        data.__since = [data.__since]
        return pull(
          pull.values(keys),
          pull.map( key=>{
            return pull(
              pull.values(data[key]),
              pull.map(data=>{
                return {type: key, data}
              })
            )
          })
        )
      }),
      pull.flatten(),
      pull.flatten(),
      pull.map(({type, data}) =>{
        type = type.replace(/Events$/,'')
        //const {timestamp, platform} = data
        //console.error(type, formatDateTime(DateTime.fromSeconds(data.timestamp/1000)))
        //console.log(platform)
        return {type, data}
        //console.log(m)
        //console.log()
      })
    )

  }
}
// -- util

function formatDateTime(t) {
  return t.setLocale('de').toLocaleString(DateTime.DATETIME_MED)
}
  
function makeGQLQuery(queries, types, params) {
  return Object.entries(queries).map( ([queryName, {args, type}]) =>{
    return `${queryName}(${args.map(x => x + ': ' + params[x]).join(', ')}) {\n${types[type].map(x=>`  ${x}`).join('\n')}\n}`
  }).join('\n')
}

function queriesFromSchema(queries) {
  return queries.reduce( (acc, {name, args, type})=>{
    acc[name] = {
      args: args.map( ({name})=>name ),
      type: type.ofType.ofType.ofType.name
    }
    return acc
  }, {})
}
