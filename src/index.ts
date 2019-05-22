import { Kax } from './Kax'
import { KaxAdvancedRenderer } from './renderers'

export default new Kax(new KaxAdvancedRenderer())

export * from './renderers'
export * from './types'
export { Kax } from './Kax'
export { KaxTask } from './KaxTask'
