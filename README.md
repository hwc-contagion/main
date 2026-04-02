    Contagion     

    Map how an earnings shock ripples through the supply chain — before the market does.                                  
   
    ---                                                                                                                   
    What it does                                                                                                        

    Type in a company and an earnings shock percentage (positive or negative), and Contagion traces that shock through
    supplier, customer, and creditor relationships up to three degrees out using a graph database. At each hop, the shock
    is multiplied by the strength of the relationship — so a company that accounts for 25% of a supplier's revenue passes
    on 25% of whatever hits it. An AI layer then reads the numbers and writes a plain-English narrative explaining where
    the risk is concentrated and why it matters.

    Why it matters

    When a major company misses earnings, markets are quick to reprice the stock itself but slow to work through the
    second- and third-order effects on everyone connected to it. By the time analysts publish notes on downstream
    exposure, the trade is already crowded. Contagion gives investors a structured head start on where contagion is likely
     to travel and how hard it will hit.

    How it works

    Each relationship in the graph carries a weight between 0 and 1 representing revenue dependency — for example, Apple
    makes up roughly 25% of TSMC's revenue, so that edge has a weight of 0.25. When a shock is applied to a source
    company, Contagion traverses the graph outward using variable-length path matching, multiplying edge weights together
    at each hop to compute a cumulative exposure fraction. A company two hops away that sits behind a 0.25-weight edge and
     a 0.35-weight edge ends up with an exposure of about 8.75% of the original shock. Once the graph query returns, the
    full result set is passed to an AI pipeline that generates a concise analyst narrative identifying the highest-risk
    nodes, where exposure decays fastest, and which relationships act as chokepoints.

    Tech stack

    - Neo4j Aura — hosts the supply chain knowledge graph and executes the multi-hop weighted path traversal
    - RocketRide AI — runs the narrative pipeline that turns raw exposure numbers into an analyst-style summary
    - Next.js — serves the React frontend and the /api/contagion route that orchestrates the query and AI call
    - Vercel — deploys and hosts the application

    Running locally

    npm install

    Create a .env.local file in the project root with the following variables:

    NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=your-password
    ROCKETRIDE_API_KEY=your-api-key

    Seed the graph database:

    npx ts-node scripts/seed.ts

    Start the development server:

    npm run dev

    ---
    Built by Mitchell Magid and Alex Arutchev at HackWithChicago 3.0.
