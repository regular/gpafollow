//jshint -W033
//jshint  esversion: 6

const {pull} = require('pull-stream')
const { DateTime, Interval, Duration } = require('luxon')

// takes an interval and generates and endless stream of
// adjacent intervals of the same length

module.exports = function(dt_start, dt_end, dt_max) {
  const duration = Interval.fromDateTimes(dt_start, dt_end).toDuration()
  let a = dt_start
  let b = dt_end
  return pull(
    function (end, cb) {
      if (end) return cb && cb(end)
      if (a > dt_max || a.equals(dt_max)) return cb(true)
      const r = {start:a, end: b}
      a = b
      b = DateTime.min(dt_max, b.plus(duration))
      return cb(null, r)
    }
  )
}
