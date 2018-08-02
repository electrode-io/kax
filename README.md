# Kax

A simple logger, based on [log-update](https://github.com/sindresorhus/log-update/issues), that can be used for command line CLIs.  
Support asynchronous task nesting out of the box without the need for complex constructs.

## Sample

The following sample code show some of the constructs offerd by Kax.

```js
const subtask = async () => {
  await kax.task('Subtask One Running').run(delay(2000))
  await kax.warn('This is a\nmultiline warning')
  await kax
    .task('Subtask Two Running', { successMsg: 'Success !' })
    .run(delay(2000))
}


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
```

It will render as follow

![alt text](media/sample.gif)

## Renderers

`kax` comes with two different renderers

- `KaxSimpleRenderer`  
  A simple renderer that do not make use of spinners and subtasks indentation. It can be useful for environments that do not play well with spinners or do not need them (for example CI envs).

- `KaxAdvancedRenderer`  
  The default `kax` renderer. It uses spinners, colors, and subtasks indentation.

## Initialization

```js
import kax from 'kax'
```

This default singleton instance comes with the default renderer `KaxAdvancedRender` attached to it, with a default configuration.

If you need to customize the renderer with your own configuration, or need to switch to a `KaxSimpleRenderer` instead, you can instantiate a renderer with a custom configuration and attached it to the kax instance.

Here is the default configuration :

```json
{
  "colorScheme": {
    "warning": "yellow",
    "error": "red",
    "info": "cyan",
    "task": "white"
  },
  "symbolScheme": {
    "info": "info",
    "warning": "warning",
    "error": "error",
    "taskRunning": "dots",
    "taskSuccess": "success",
    "taskFailure": "error"
  },
  "symbolizeMultiLine": true,
  "shouldLogTime": false
}
```

- The colors in `colorScheme` can be any of the colors from [chalk](https://www.npmjs.com/package/chalk).
- The symbols in `symbolScheme` can be any of the symbols from [log-symbols].(https://github.com/sindresorhus/log-symbols#readme) except for the `taskRunning` symbol, which is a spinner and can be any of the spinners from [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme).
- `symbolizeMultiLine` indicates whether to add a prepend a symbol to each line of a multiline message, or only to the first line.
- `shouldLogTime` indicated whether to suffix the tasks lines with a timer to show how long the task has been running for.

If you need to replace the default renderer configuration with your own, just import the renderer class you need, and instantiate it with the config, as follow :

```js
import { KaxAdvancedRender } from 'kax'
const myRenderer = new KaxAdvancedRenderer(myConfig)
```

Then you can simply attach this new renderer to the `kax` instance

```js
kax.renderer = myRenderer
```

Alternatively you can directly construct an instance of `kax` providing your renderer, if you don't want to use the default singleton instance

```js
import { Kax } from 'kax'
const kax = new Kax(myRenderer)
```

## Api

```js
kax.info(msg /* string */)
```

Renders a message using the info level.  
The color used for the message will be the one set in the `colorScheme` config (defaults to `cyan`).  
The symbol prepended to the message will be the one set in the `symbolScheme` config (defaults to `info`).

```js
kax.warn(msg /* string */)
```

Renders a message using the warn level.  
The color used for the message will be the one set in the `colorScheme` config (defaults to `yellow`).  
The symbol prepended to the message will be the one set in the `symbolScheme` config (defaults to `warning`).

```js
kax.error(msg /* string */)
```

Renders a message using the error level.  
The color used for the message will be the one set in the `colorScheme` config (defaults to `red`).  
The symbol prepended to the message will be the one set in the `symbolScheme` config (defaults to `error`).

```js
kax.task(msg /* string */)
```

Renders a message using the task level.  
The color used for the message will be the one set in the `colorScheme` config (defaults to `white`).  
The symbol prepended to the message will be a spinner (defaults to `dots`).

The spinner attached to the message will start spinning upon invocation of this function, and will continue spinning until task completion.

There are two different ways to run/complete a task. Implicilty, or explicitly.

### Implicit task run/completion (handled by `kax`)

This can be achieved by calling `run` on the `KaxTask` instance returned by `kax.task`.

```js
kax.task(msg /* string */).run(task /* Promise<T> */, {
  successMsg /* string [optional] */,
  errorMsg /* string [optional] */,
})
```

The task provided to the `run` function, is a function that returns a `Promise`.  
`kax` will await for this Promise completion, and upon completion will updated the message spinner with either the `taskSuccess` symbol from config (defaults to `success`) or the `taskFailure` symbol from config (defaults to `error`). In the case of successful completion, `kax` will return the result of the `Promise` task, and in the case of failure, it will rethrow the task exception.

`successMsg` and `errorMsg` are both optional. If not set, the original `msg` will be used instead.

### Explicit task run/completion (handled manually)

Instead of using the `run` function, it is also possible to control the task completion manually. In this case, `kax` is not wrapping/monitoring the task so it has no way of knowing when it completes, and what is the completion status.

You can manually call the following two functions on the `KaxTask` object to either complete the task successfully or with a failure

```js
kaxTask.succeed(successMsg /* string [optional] */)
```

Manually completes the task with success. It will update the spinner with the `taskSuccess` symbol from config (defaults to `success`) and the mesage with `successMsg` (if provided, otherwise it will leave original message untouched).

```js
kaxTask.fail(errorMsg /* string [optional] */)
```

Manually completes the task with failure. It will update the spinner with the `taskFailure` symbol from config (defaults to `error`) and the mesage with `errorMsg` (if provided, otherwise it will leave original message untouched).

### Automatic task indentation

When using the default `KaxAdvancedRenderer`, if a task is started while a previous one is still running, the renderer new task message (and any other messages) will be automatically indented until the parent task completes.
