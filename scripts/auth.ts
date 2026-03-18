/**
 * One-time script to generate your RTM auth token.
 * Run: npx tsx scripts/auth.ts
 *
 * Prerequisites: RTM_API_KEY and RTM_SHARED_SECRET must be set in .env.local
 */

import crypto from 'crypto'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

require('dotenv').config({ path: '.env.local' })

const API_KEY = process.env.RTM_API_KEY!
const SHARED_SECRET = process.env.RTM_SHARED_SECRET!

if (!API_KEY || !SHARED_SECRET) {
  console.error('❌  RTM_API_KEY and RTM_SHARED_SECRET must be set in .env.local')
  process.exit(1)
}

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return crypto.createHash('md5').update(SHARED_SECRET + sorted).digest('hex')
}

async function rtmGet(method: string, params: Record<string, string> = {}) {
  const all: Record<string, string> = {
    method,
    api_key: API_KEY,
    format: 'json',
    ...params,
  }
  all.api_sig = sign(all)
  const url = 'https://api.rememberthemilk.com/services/rest/?' + new URLSearchParams(all)
  const res = await fetch(url)
  const json = await res.json()
  if (json.rsp.stat !== 'ok') throw new Error(json.rsp.err?.msg ?? 'RTM error')
  return json.rsp
}

async function main() {
  console.log('\n🥛 milk-pm auth setup\n')

  // Step 1: get frob
  const { frob } = await rtmGet('rtm.auth.getFrob')

  // Step 2: build auth URL
  const authParams: Record<string, string> = {
    api_key: API_KEY,
    frob,
    perms: 'delete', // delete covers read + write + delete
  }
  authParams.api_sig = sign(authParams)
  const authUrl = 'https://www.rememberthemilk.com/services/auth/?' + new URLSearchParams(authParams)

  console.log('1. Open this URL in your browser and authorize milk-pm:\n')
  console.log('   ' + authUrl)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  await new Promise<void>((resolve) => {
    rl.question('2. Press Enter once you have authorized the app...', () => {
      rl.close()
      resolve()
    })
  })

  // Step 3: get token
  const { auth } = await rtmGet('rtm.auth.getToken', { frob })
  const token: string = auth.token

  console.log('\n✅ Auth token obtained!\n')

  // Step 4: write to .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

  if (envContent.includes('RTM_AUTH_TOKEN=')) {
    envContent = envContent.replace(/RTM_AUTH_TOKEN=.*/g, `RTM_AUTH_TOKEN=${token}`)
  } else {
    envContent += `\nRTM_AUTH_TOKEN=${token}\n`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('   Written to .env.local\n')
  console.log('   Add RTM_AUTH_TOKEN to your Vercel environment variables to deploy.\n')
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
