//jshint -W033
//jshint  esversion: 6
const pull = require('pull-stream')
const { request, GraphQLClient } = require('graphql-request')
const { DateTime } = require('luxon')

module.exports = function(token, endpoint) {
  const headers = {
    'Authorization': `Bearer ${token}`
  }
  
  return {through, schema}

  function schema(cb) {
    const query = `{
      __schema {
        types {
          name
          fields {
            name
          }
        }
        queryType {
          fields {
            name,
            args {
              name
            }
            type {
              ofType {
                kind
                ofType {
                  ofType {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }`

    request({
      url: endpoint,
      document: query,
      requestHeaders: headers,
    }).then( data => cb(null, data) ).catch( err=>cb(err) )
  }
  
  function through(query) {
    return pull.asyncMap( ({start, end}, cb)=>{
      const ts_start = start.toUnixInteger() * 1000
      const ts_end = end.toUnixInteger() * 1000
      //console.error(`${ts_start} ${ts_end}`)

      const variables = {
        tsgte: ts_start,
        tslte: ts_end
      }

      request({
        url: endpoint,
        document: `query getBins($tsgte: Float!, $tslte: Float) { ${query} }`,
        variables,
        requestHeaders: headers,
      }).then( data => {
        data.__since = {timestamp: ts_end}
        cb(null, data)
      }).catch( err=>cb(err) )
    })
  }
}
