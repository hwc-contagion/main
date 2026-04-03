import path from 'path'
import { RocketRideClient } from 'rocketride'

const client = new RocketRideClient({
  uri: process.env.ROCKETRIDE_URI,
  auth: process.env.ROCKETRIDE_API_KEY,
  env: { ROCKETRIDE_OPENAI_KEY: process.env.ROCKETRIDE_OPENAI_KEY ?? '' },
  persist: true,
})

let connectPromise: Promise<void> | null = null

async function ensureConnected() {
  if (!client.isConnected()) {
    if (!connectPromise) {
      connectPromise = client.connect().finally(() => { connectPromise = null })
    }
    await connectPromise
  }
}

async function getPipelineToken(file: string, version: number): Promise<string> {
  await ensureConnected()
  const { token } = await client.use({
    filepath: path.join(process.cwd(), file),
    token: `${file}-v${version}`,
    ttl: 3600,
    useExisting: true,
  })
  return token
}

const NARRATIVE_VERSION = 5
let narrativeToken: string | null = null

export async function getNarrativeToken(): Promise<string> {
  if (!narrativeToken) narrativeToken = await getPipelineToken('narrative.pipe', NARRATIVE_VERSION)
  return narrativeToken
}

export function invalidateNarrativeToken() {
  const old = narrativeToken
  narrativeToken = null
  if (old) client.terminate(old).catch(() => {})
}

const PARSE_SHOCK_VERSION = 1
let parseShockToken: string | null = null

export async function getParseShockToken(): Promise<string> {
  if (!parseShockToken) parseShockToken = await getPipelineToken('parse-shock.pipe', PARSE_SHOCK_VERSION)
  return parseShockToken
}

export function invalidateParseShockToken() {
  const old = parseShockToken
  parseShockToken = null
  if (old) client.terminate(old).catch(() => {})
}

export { client as rrClient }
