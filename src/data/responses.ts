// @root/src/data/responses.ts
// Barrel file that merges all response modules

import core from './responses.json'
import moderation from './respMod.json'
import fun from './respFun.json'

// Merge all response modules into a single object
const responses = {
  ...core,
  ...moderation,
  ...fun,
} as const

export default responses
