#! /usr/bin/env node

const { spawn }   = require('child_process')
const express     = require('express')
const bodyParser  = require('body-parser')
const winston     = require('winston')
const { logger }  = require('express-winston')
                    require('winston-daily-rotate-file')
const mkdirp      = require('mkdirp')
const httpStatus  = require('http-status-codes')

function createServer () {
  let transport = null
  if (process.env.LOG === 'stdout') {
    transport = new winston.transports.Console({
      json: true,
    })
  } else {
    mkdirp('./logs')
    transport = new winston.transports.DailyRotateFile({
      filename: './logs/log',
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      level: process.env.ENV === 'development' ? 'debug' : 'info',
    })
  }

  const app = express()
  app.use(bodyParser.json())
  app.use(logger({
    requestWhitelist: [ 'body' ],
    transports: [ transport ],
  }))

  return app
}

// Requires some top-level JSON field to exist and have
// a `typeof` that matches the `fieldType` parameter.
function req (fieldName, fieldType) {
  return function (req, res, next) {
    const body = req.body || {}

    if (typeof body[fieldName] !== fieldType) {
      let errMsg = { error: `missing "${fieldName}" field` }
      res.status(httpStatus.BAD_REQUEST).send(errMsg)
    } else {
      next()
    }
  }
}

// Spawn a Java child process to run the given
// source code and compute an execution trace.
function runTrace (source) {
  const proc = spawn('java', [
    '-cp',
    'bin:packages/*',
    'GenerateTrace',
  ])

  proc.stdin.setEncoding('utf-8')
  proc.stdin.write(source)
  proc.stdin.end()

  return proc
}

const port = process.env.PORT || 8080
const app = createServer()

app.post('/', req('source', 'string'), (req, res) => {
  const proc = runTrace(req.body.source)
  
  let stdout = ''
  let stderr = ''
  proc.stdout.on('data', (data) => { stdout += data })
  proc.stderr.on('data', (data) => { stderr += data })

  proc.on('close', (code) => {
    if (code === 0) {
      try {
        res.status(httpStatus.OK).json(JSON.parse(stdout))
      } catch (err) {
        const errMsg = { error: 'malformed program trace' }
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errMsg)
      }
    } else {
      console.log(stdout)
      const errMsg = { error: 'unexpected internal error' }
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errMsg)
    }
  })
})

app.listen(port)
console.log(`listening on port ${port}`)
