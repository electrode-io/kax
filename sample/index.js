const kax = require('../dist/index').default

const delay = d =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, d)
  })

const subtask = async () => {
  await kax.task('delay 2000').run(delay(2000))
  await kax.warn('Here is a\nmultiline warning')
  await kax.task('delay 3000').run(delay(3000))
}

const main = async () => {
  kax.info('Some info for you')
  kax.warn('And now a warning')
  kax.error('And error')

  await kax.task('delay 4000').run(delay(4000))
  await kax.task('subtasks').run(subtask())
  await kax.task('delay 5000').run(delay(5000))
  const custom = kax.task('Manually controlled task')
  await delay(2000)
  custom.text = 'Changing text'
  await delay(2000)
  custom.succeed('Done !')
}

main().then(() => {})
