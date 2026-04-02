import { RocketRideClient } from 'rocketride';

async function checkSetup() {
  console.log('Checking RocketRide setup...');

  const client = new RocketRideClient();

  try {
    await client.connect();
    console.log('✅ Connected to RocketRide server');

    const result = await client.use({ filepath: 'narrative.pipe' });
    console.log(`✅ Pipeline loaded with token: ${result.token}`);

    await client.disconnect();
    console.log('✅ Disconnected successfully');

    console.log('\n🎉 RocketRide setup is working!');
  } catch (error) {
    console.error('❌ Setup check failed:', error);
    process.exit(1);
  }
}

checkSetup();