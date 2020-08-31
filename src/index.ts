import { Kax } from './Kax'
import { KaxAdvancedRenderer, KaxSimpleRenderer } from './renderers'

const getDefaultRenderer = () => {
  return process.env.TERM === 'dumb' || process.env.CI
    ? new KaxSimpleRenderer()
    : new KaxAdvancedRenderer()
}
export default new Kax(getDefaultRenderer())
export { getDefaultRenderer }

export * from './renderers'
export * from './types'
export { Kax } from './Kax'
export { KaxTask } from './KaxTask'
