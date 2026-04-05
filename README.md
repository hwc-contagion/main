# TREMOR

**Map how an earnings shock ripples through the supply chain — before the market does.**

---

## What it does

TREMOR lets you pick any company, set an earnings shock (positive or negative), and instantly see every connected company that gets hit — ranked by exposure, with the contagion path shown on an interactive supply chain graph. You can describe a scenario in plain English ("an earthquake destroyed Apple's factory in Taiwan") and an AI layer extracts the company and magnitude automatically. A portfolio exposure calculator then shows exactly how much of your portfolio's value is at indirect risk through supply chain relationships you might not have known existed.

## Why it matters

When a major company misses earnings, markets quickly reprice the stock itself but are slow to work through second- and third-order effects on everyone connected to it. By the time analyst notes on downstream exposure hit the street, the trade is already crowded. TREMOR gives investors a structured head start on where contagion is likely to travel, how hard it will hit, and which nodes in the network are the most fragile.

## How it works

Each relationship in the supply chain graph carries a weight between 0 and 1 representing revenue dependency — Apple accounts for roughly 25% of TSMC's revenue, so that edge has a weight of 0.25. When a shock is applied, TREMOR traverses the graph outward up to three hops using variable-length path matching, multiplying edge weights at each step to compute a cumulative exposure fraction. A company two hops away behind a 0.25 and a 0.35 edge ends up with roughly 8.75% of the original shock. The full result set is then passed to an AI pipeline that writes a plain-English analyst narrative identifying the highest-risk nodes, where exposure decays fastest, and which relationships act as chokepoints.

Portfolio exposure works by resolving each of your holdings against the contagion results and multiplying position weight by supply chain exposure — so if you hold 10% of your portfolio in a company that carries 15% indirect exposure, your contribution from that holding is 1.5 percentage points of portfolio impact.

## Tech stack

- **Neo4j Aura** — hosts the supply chain knowledge graph and executes the multi-hop weighted path traversal
- **RocketRide AI** — runs the narrative pipeline that turns raw exposure numbers into an analyst-style summary
- **Next.js** — serves the React frontend and the API routes that orchestrate graph queries and AI calls
- **Vercel** — deployment and hosting

## Running locally

```bash
npm install
```

Create a `.env.local` file in the project root:

```
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
ROCKETRIDE_API_KEY=your-api-key
```

Seed the graph database:

```bash
npx ts-node scripts/seed.ts
```

Start the dev server:

```bash
npm run dev
```

---

Built by Mitchell Magid and Alex Arutchev at HackWithChicago 3.0.
