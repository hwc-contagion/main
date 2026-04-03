import path from 'path'
import { RocketRideClient } from 'rocketride'

const client = new RocketRideClient({
  uri: process.env.ROCKETRIDE_URI,
  auth: process.env.ROCKETRIDE_API_KEY,
  env: { ROCKETRIDE_OPENAI_KEY: process.env.ROCKETRIDE_OPENAI_KEY ?? '' },
  persist: true,
})

let connectPromise: Promise<void> | null = null
let narrativeToken: string | null = null
const NARRATIVE_PIPE_VERSION = 5

async function ensureConnected() {
  if (!client.isConnected()) {
    if (!connectPromise) {
      connectPromise = client.connect().finally(() => { connectPromise = null })
    }
    await connectPromise
  }
}

export async function getNarrativeToken(): Promise<string> {
  await ensureConnected()
  if (!narrativeToken) {
    const { token } = await client.use({
      filepath: path.join(process.cwd(), 'narrative.pipe'),
      token: `narrative-pipeline-v${NARRATIVE_PIPE_VERSION}`,
      ttl: 3600,
      useExisting: true,
    })
    narrativeToken = token
  }
  return narrativeToken
}

export function invalidateNarrativeToken() {
  const old = narrativeToken
  narrativeToken = null
  if (old) client.terminate(old).catch(() => {})
}

export { client as rrClient }
