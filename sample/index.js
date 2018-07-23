const kax = require('../dist').kax

const delay = d =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, d)
  })

const subtask = async () => {
  await kax.task('delay 2000').run(delay(2000))
  await kax.warn('Some quick warning')
  await kax.task('delay 3000').run(delay(3000))
}

const main = async () => {
  kax
    .info('Some info for you')
    .warn('And now a warning')
    .error('And error')

  await kax.task('delay 4000').run(delay(4000))
  await kax.task('subtasks').run(subtask())
  await kax.task('delay 5000').run(delay(5000))
  const custom = kax.task('Manually controlled task')
  await delay(3000)
  custom.succeed('Done !')
}

main().then(() => {})
