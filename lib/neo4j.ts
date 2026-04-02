import neo4j, { type Driver } from "neo4j-driver";

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;
    if (!uri || !user || !password) {
      throw new Error(
        "Missing required environment variables: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD"
      );
    }
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

export async function runQuery(
  query: string,
  params: Record<string, unknown> = {}
): Promise<Record<string, unknown>[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}
