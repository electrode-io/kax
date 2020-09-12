/* eslint-disable @typescript-eslint/no-var-requires */

const kax = require('../dist/index').default

const delay = ms =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })

const subtask = async () => {
  await kax.task('Subtask One Running').run(delay(2000))
  await kax.warn('This is a\nmultiline warning')
  await kax
    .task('Subtask Two Running', { successMsg: 'Success !' })
    .run(delay(2000))
}

const main = async () => {
  kax.info('This is an info line')
  kax.warn('This is a warn line')
  kax.error('This is an error line')

  await kax.task('Running a top level task').run(delay(2000))
  await kax.task('Running Subtasks').run(subtask())
  const task = kax.task('Running a task manually')
  await delay(2000)
  task.text = 'Text can be changed dynamically'
  await delay(2000)
  task.succeed('Done !')
}

main()
