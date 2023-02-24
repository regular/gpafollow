//jshint -W033
//jshint -W018
//jshint  esversion: 6
const https = require('https')
const BufferList = require('bl')

module.exports = function(token, endpoint) {
  const options = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  return function(cb) {
    console.log('Requesting Ids ...')
    const req = https.get(endpoint, options, res => {
      const bl = BufferList((err, data)=>{
        if (err) return cb && cb(err)
        let o
        try {
          o = JSON.parse(data)
        } catch(e) {
          err = e
        }
        if (cb) cb(err, o)
      })
      res.pipe(bl)
    })
    req.on('error', err => {
      if (cb) cb(err)
      cb = null
    })
  }
}
