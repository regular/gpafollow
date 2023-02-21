//jshint -W033
//jshint  esversion: 6

const {pull} = require('pull-stream')
const interval = require('./interval')

const { DateTime } = require('luxon')


const start = DateTime.fromISO('2019-07-17')
const end = DateTime.fromISO('2022-03-01')
const max = DateTime.fromISO('2030-01-01')

pull(
  interval(start, end, max),
  pull.take(10),
  pull.drain( ({start, end})=>{
    console.log(start.toISO(), end.toISO())
  })
)
