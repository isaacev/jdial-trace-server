const fs        = require('fs')
const path      = require('path')
const { spawn } = require('child_process')
const chalk     = require('chalk')

const verboseFlag = '--verbose'

console.log('===============================================================')
console.log(' |')
console.log(' |  WHAT THIS CHECK MEANS')
console.log(' |')
console.log(' |     A successful check DOES NOT indicate that there are no')
console.log(' |     bugs and DOES NOT indicate that all the code works.')
console.log(' |')
console.log(' |     A successful check indicates that this server is')
console.log(' |     PROBABLY set up enough to do basic work.')
console.log(' |')
console.log('===============================================================')

console.log('')
runChecks([
  checkNodeModulesNotEmpty,
  checkJava8Installation,
  checkBinNotEmpty,
  checkBasicTrace,
]).then(() => console.log(''))

function printMessage (color, mark) {
  return (msg) => {
    let message = (typeof msg === 'string') ? msg : msg.message
    let verbose = (typeof msg === 'string') ? false : msg.verbose

    console.log('  ' + color(mark) + ' ' + message)

    if (verbose && flagIsSet(verboseFlag)) {
      console.log('\n' + color(verbose.trim()) + '\n')
    }
  }
}

function runChecks (checks) {
  return new Promise((resolve, reject) => {
    let check = checks.shift()

    if (check === undefined) {
      resolve()
    } else {
      check()
        .then(printMessage(chalk.green, '✓'))
        .catch(printMessage(chalk.red, '✗'))
        .then(() => {
          runChecks(checks)
            .then(resolve)
            .catch(reject)
        })
    }
  })
}

function checkJava8Installation () {
  return new Promise((resolve, reject) => {
    exec('which', [ 'java' ]).then((output) => {
      if (output.code !== 0 || output.stdout.length === 0) {
        // There is no program on the PATH with the name `java`.
        reject('Java does not seem to be installed ' +
          '(no program on PATH named `java`)')
      } else {
        exec('java', [ '-version' ]).then((output) => {
          if (output.code !== 0 || /\b1\.8\.\d/.test(output.stderr) === false) {
            // The Java version info didn't contain the sequence `1.8.\d`.
            reject({
              message: 'Java 8 does not seem to be installed (expected v1.8.x)',
              verbose: output.stderr,
            })
          } else {
            resolve('Java 8 seems to be installed')
          }
        }).catch(() => {
          reject('Java 8 does not seem to be installed (error calling `java`)')
        })
      }
    }).catch(() => {
      reject('Cannot determine if Java 8 is installed (error calling `which`)')
    })
  })
}

// Check that the `bin` directory exists and is not empty.
function checkBinNotEmpty () {
  return new Promise((resolve, reject) => {
    let dirPath = path.resolve(__dirname, './bin')
    return checkDirNotEmpty(dirPath)
      .then(resolve.bind(resolve, 'Java classes seem to be compiled'))
      .catch(reject.bind(reject, 'Java classes do not seem to be compiled ' +
        '(`./bin` could not be read or is empty)'))
  })
}

// Check the `node_modules` directory exists and is not empty.
function checkNodeModulesNotEmpty () {
  return new Promise((resolve, reject) => {
    let dirPath = path.resolve(__dirname, './node_modules')
    return checkDirNotEmpty(dirPath)
      .then(resolve.bind(resolve, 'Node modules seem to be installed'))
      .catch(reject.bind(reject, 'Node modules do not seem to be installed ' +
        '(`./node_modules` could not be read or is empty)'))
  })
}

function checkBasicTrace () {
  return new Promise((resolve, reject) => {
    const classPath = 'bin:packages/*'
    const mainClass = 'GenerateTrace'
    const sampleProg = `
      public class Sample {
        public static void main (String[] args) {
          System.out.println("hello world");
        }
      }`

    execPipe('java', [ '-cp', classPath, mainClass ], sampleProg).then((output) => {
      if (output.code !== 0) {
        if (flagIsSet(verboseFlag)) {
          reject({
            message: 'Cannot execute a basic program trace',
            verbose: output.stderr + '\n' + output.stdout,
          })
        } else {
          reject('Cannot execute a basic program trace ' +
            '(re-run with `--verbose` to see error message)')
        }
      } else {
        try {
          JSON.parse(output.stdout)
          resolve({
            message: 'Executed simple program trace',
            verbose: output.stdout,
          })
        } catch (err) {
          if (flagIsSet(verboseFlag)) {
            reject({
              message: 'Cannot execute a basic program trace',
              verbose: output.stdout,
            })
          } else {
            reject('Cannot execute a basic program trace ' +
              '(re-run with `--verbose` to see error message)')
          }
        }
      }
    }).catch(() => {
      reject('Cannot execute a basic program trace')
    })
  })
}

function exec (cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args)
    
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => { stdout += data })
    proc.stderr.on('data', (data) => { stderr += data })

    proc.on('error', reject)
    proc.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

function execPipe (cmd, args, stdin) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args)

    proc.stdin.setEncoding('utf-8')
    proc.stdin.write(stdin)
    proc.stdin.end()

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => { stdout += data })
    proc.stderr.on('data', (data) => { stderr += data })

    proc.on('error', reject)
    proc.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

function checkDirNotEmpty (dirPath) {
  return new Promise((resolve, reject) => {
    fs.stat(dirPath, (err, stats) => {
      if (err) {
        reject()
      } else if (stats.isDirectory() === false) {
        reject()
      } else {
        fs.readdir(dirPath, (err, files) => {
          if (err) {
            reject()
          } else if (files.length === 0) {
            // Expect directory to have some files.
            reject()
          } else {
            resolve()
          }
        })
      }
    })
  })
}

function flagIsSet (flag) {
  let argv = process.argv

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag) {
      return true
    }
  }

  return false
}
