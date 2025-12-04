// @root/src/data/responses.ts
// Barrel file that merges all response modules

import core from './responses.json'
import moderation from './respMod.json'
import fun from './respFun.json'
import economy from './respEconomy.json'
import music from './respMusic.json'
import ticket from './respTicket.json'
import info from './respInfo.json'
import utility from './respUtility.json'
import admin from './respAdmin.json'
import minaai from './respMinaAi.json'
import guild from './respGuild.json'
import social from './respSocial.json'
import automod from './respAutomod.json'
import report from './respReport.json'
import purge from './respPurge.json'
import profile from './respProfile.json'

// Merge all response modules into a single object
const responses = {
  ...core,
  ...moderation,
  ...fun,
  ...economy,
  ...music,
  ...ticket,
  ...info,
  ...utility,
  ...admin,
  ...minaai,
  ...guild,
  ...social,
  ...automod,
  ...report,
  ...purge,
  ...profile,
} as const

export default responses
