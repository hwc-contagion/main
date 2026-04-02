import { RocketRideClient, Question } from 'rocketride'

export async function POST(request: Request) {
  let contagionData: object
  try {
    contagionData = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const client = new RocketRideClient({
    uri: process.env.ROCKETRIDE_URI,
    auth: process.env.ROCKETRIDE_APIKEY,
  })
  try {
    await client.connect()
    const { token } = await client.use({ filepath: 'narrative.pipe' })

    const question = new Question()
    question.addContext(contagionData)
    question.addQuestion('Generate the risk narrative.')

    const response = await client.chat({ token, question })
    const narrative = response.answers?.[0] ?? ''

    return Response.json({ narrative })
  } catch (error) {
    console.error('Narrative pipeline error:', error)
    return Response.json({ error: 'Failed to generate narrative' }, { status: 500 })
  } finally {
    await client.disconnect()
  }
}
