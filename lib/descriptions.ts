export const COMPANY_DESCRIPTIONS: Record<string, string> = {
  Apple:
    "Apple designs and sells consumer electronics, software, and services anchored by the iPhone. Its hardware is assembled in Asia using components from hundreds of global suppliers, making it the anchor customer for much of the semiconductor supply chain. Services — App Store, iCloud, Apple Pay — now represent roughly a quarter of revenue.",

  TSMC:
    "Taiwan Semiconductor Manufacturing is the world's largest contract chipmaker, producing chips for Apple, Nvidia, Qualcomm, and most other fabless designers. It holds roughly 60% of the global foundry market and more than 90% of the most advanced nodes. All of its production is in Taiwan, creating a singular geographic concentration risk.",

  ASML:
    "ASML is the sole supplier of extreme ultraviolet (EUV) lithography machines, the equipment required to print transistors below 7nm. Each machine takes over a year to build and costs upward of $150 million. No advanced chip can be manufactured without it, making ASML a systemic chokepoint in global semiconductor supply.",

  Qualcomm:
    "Qualcomm designs mobile processors and modems used in the majority of Android smartphones and a portion of Apple's iPhones. Its Snapdragon platform handles cellular connectivity, AI, and graphics for devices from Samsung, Google, and Xiaomi. It is fabless — all manufacturing is outsourced to TSMC and Samsung Foundry.",

  Broadcom:
    "Broadcom supplies networking chips, Wi-Fi and Bluetooth components, and storage controllers for data centers and consumer devices. It is Apple's primary source for wireless connectivity chips. Its 2023 acquisition of VMware added a large enterprise software business to its hardware base.",

  Samsung:
    "Samsung Electronics is simultaneously a foundry, a memory maker, and a consumer device brand — one of the few vertically integrated semiconductor companies in the world. Its memory division (DRAM, NAND) and foundry business compete with TSMC for leading-edge contracts. Samsung is Apple's single largest component supplier by spend.",

  Nvidia:
    "Nvidia designs the GPUs that power modern AI training and inference, with its H100 and B200 chips in heavy demand from every major cloud provider. The company is fabless, outsourcing all production to TSMC, which creates supply concentration risk. Data center revenue has overtaken gaming as its dominant segment.",

  GlobalFoundries:
    "GlobalFoundries is the world's third-largest contract foundry, operating fabs in the US, Germany, and Singapore. Unlike TSMC, it focuses on mature and specialty nodes (22nm and above) for automotive, aerospace, and defense customers. It receives significant US government subsidies as a domestic chip production asset.",

  'Applied Materials':
    "Applied Materials supplies the deposition, etch, and inspection equipment used in nearly every semiconductor fab in the world. Chipmakers depend on its tools at multiple steps in the manufacturing process. It sits upstream of both TSMC and its customers, making it a bellwether for capital spending across the industry.",

  'Lam Research':
    "Lam Research makes etch and deposition equipment critical to fabricating NAND flash and DRAM memory chips. Memory makers — Samsung, SK Hynix, and Micron — are its largest customers. Capital spending cycles in the memory industry drive significant revenue volatility for Lam.",

  CRUS:
    "Cirrus Logic designs mixed-signal and audio chips used almost exclusively in Apple devices, particularly the iPhone's audio and haptic systems. Apple accounts for over 80% of its revenue, making it one of the most Apple-concentrated suppliers in the supply chain.",

  SWKS:
    "Skyworks Solutions makes radio-frequency chips that enable cellular connectivity in smartphones. It is a major supplier to Apple for iPhone RF front-end modules. Its revenue is highly correlated with iPhone production cycles.",

  QRVO:
    "Qorvo designs RF semiconductors for mobile, defense, and IoT markets. Like Skyworks, it supplies cellular connectivity components to Apple and other smartphone makers. Its defense business — radar, satellite, and electronic warfare — provides some offset against consumer cycle volatility.",

  AMKR:
    "Amkor Technology is the world's second-largest outsourced semiconductor assembly and test (OSAT) company. It packages chips for Apple, Qualcomm, and most major fabless designers after wafers are cut at foundries like TSMC. Its revenue closely tracks overall semiconductor production volume.",

  LRCX:
    "Lam Research makes etch and deposition equipment critical to fabricating NAND flash and DRAM memory chips. Memory makers — Samsung, SK Hynix, and Micron — are its largest customers. Capital spending cycles in the memory industry drive significant revenue volatility.",

  ENTG:
    "Entegris supplies specialty chemicals, filtration systems, and advanced materials used inside semiconductor fabs. It is a direct supplier to TSMC, Samsung, and Intel for materials consumed in wafer processing. Demand rises with fab utilization and falls when chipmakers cut production.",

  ADI:
    "Analog Devices designs high-performance analog and mixed-signal chips for industrial, automotive, and communications applications. Its chips convert real-world signals — temperature, pressure, motion — into digital data. The industrial and automotive segments give it lower cyclicality than pure consumer chip companies.",

  MCHP:
    "Microchip Technology makes microcontrollers and analog semiconductors for industrial, automotive, and IoT applications. It serves over 125,000 customers, reducing concentration risk relative to more Apple-exposed peers. Its acquisition of Microsemi added aerospace and defense exposure.",

  'NXP Semiconductors':
    "NXP Semiconductors is the leading supplier of automotive-grade chips, including the secure elements used in iPhone and Android NFC payments. Its automotive revenue — ADAS, electrification, body control — makes up over half of sales. NXP is heavily exposed to auto production cycles in Europe and China.",

  'Analog Devices':
    "Analog Devices designs signal-processing chips for industrial automation, healthcare, and communications infrastructure. Its 2021 acquisition of Maxim Integrated roughly doubled its size. Industrial end markets — which value long product lifetimes — insulate it somewhat from consumer electronics downturns.",

  'Microchip Technology':
    "Microchip Technology makes microcontrollers and analog chips for industrial, automotive, and IoT end markets. Its chips appear in factory automation, HVAC systems, and vehicles, giving it broad but cyclical industrial exposure. It targets fragmented markets where switching costs are high.",

  'Marvell Technology':
    "Marvell Technology designs custom silicon and data infrastructure chips for cloud providers, including AI accelerators built to spec for Amazon and Google. Its cloud custom compute and electro-optics businesses have grown rapidly alongside AI infrastructure buildout. It is fabless, relying on TSMC.",

  'Monolithic Power':
    "Monolithic Power Systems designs power management ICs used in AI servers, storage, automotive, and consumer electronics. Its chips regulate voltage in Nvidia GPU boards and in many notebook computers. Revenue has grown rapidly as AI data center power requirements have increased.",

  'Texas Instruments':
    "Texas Instruments is the world's largest analog chip maker, supplying power management, signal chain, and embedded processing chips across industrial, automotive, and consumer markets. With over 100,000 products and 100,000 customers, it has the most diversified end-market exposure of any chip company. It owns its own fabs, unusual for its scale.",

  'ON Semiconductor':
    "ON Semiconductor (onsemi) focuses on silicon carbide (SiC) power semiconductors and image sensors for electric vehicles and industrial applications. Tesla, GM, and other EV makers depend on its SiC modules for inverter efficiency. Its pivot to automotive from broad-market distribution has compressed margins but improved strategic positioning.",

  Wolfspeed:
    "Wolfspeed is a pure-play silicon carbide semiconductor manufacturer, producing substrates and power devices for EV drivetrains and EV charging infrastructure. It operates its own crystal growth and fab operations, with a flagship fab in North Carolina. Demand is tied directly to EV adoption rates globally.",

  Boeing:
    "Boeing is one of two Western commercial aircraft manufacturers and the largest US defense contractor. Its 737 MAX production issues and 787 supply chain delays have created years of backlog and supplier instability. Defense programs — F-15, F/A-18, tankers — provide a more stable revenue base than its troubled commercial division.",

  'Spirit AeroSystems':
    "Spirit AeroSystems is Boeing's largest fuselage supplier, making the 737 MAX fuselage and other major aerostructures. It was originally spun out of Boeing in 2005, and quality and delivery problems at Spirit have directly contributed to Boeing's production difficulties. Boeing announced plans to reacquire Spirit in 2024.",

  Airbus:
    "Airbus is Europe's commercial aircraft manufacturer and Boeing's only large-scale competitor for narrowbody and widebody jets. Its A320 family has a massive order backlog stretching past 2030. Defense and space activities — Eurofighter, Ariane rockets — represent a smaller but growing portion of revenue.",

  RTX:
    "RTX (formerly Raytheon Technologies) is a defense and aerospace conglomerate supplying jet engines (Pratt & Whitney), missiles (Raytheon), and avionics (Collins Aerospace). Pratt & Whitney's geared turbofan engine problems have required costly inspections and early removals across hundreds of aircraft. It is the second-largest US defense contractor.",

  DCO:
    "Ducommun manufactures structural components, electronic systems, and assemblies for aerospace and defense platforms. Its customers include Boeing, Airbus, and the US Department of Defense. As a Tier 2 supplier it sits downstream from major aerostructure integrators.",

  HXL:
    "Hexcel manufactures carbon fiber composites used in commercial aircraft, military jets, and wind turbine blades. Boeing and Airbus together account for the majority of its revenue. Composite content per aircraft has grown with each new platform, expanding Hexcel's addressable content per plane.",

  'Lockheed Martin':
    "Lockheed Martin is the world's largest defense contractor and maker of the F-35 stealth fighter, which represents about 30% of its revenue. It also produces missiles, satellites, and helicopter systems. Its revenue is almost entirely US and allied government spending.",

  'General Dynamics':
    "General Dynamics produces nuclear submarines, Gulfstream business jets, combat vehicles, and defense IT systems. Its Gulfstream division is the only significant commercial product line, insulating it partially from pure defense budget cycles. Submarine production is a multi-decade program with minimal competition.",

  Textron:
    "Textron manufactures Bell helicopters, Cessna aircraft, and military vehicles including the V-22 Osprey tiltrotor. Its industrial segment makes Kautex fuel systems and Jacobsen turf equipment. Bell's military helicopter programs provide stable long-cycle government revenue.",

  GKN:
    "GKN Aerospace (part of Melrose Industries) manufactures wing structures, nacelles, and transparencies for commercial and military aircraft. It supplies Airbus for A320 and A350 programs and Boeing for various platforms. Reshoring and supply chain localization pressures are reshaping its long-term contract structure.",

  'Triumph Group':
    "Triumph Group is a Tier 2 aerospace supplier making mechanical and structural components for Boeing, Airbus, and military programs. It has been restructuring for several years, divesting non-core businesses to focus on aftermarket services. Declining original equipment content has pressured revenue.",

  GE:
    "GE Aerospace (separated from GE Vernova in 2024) manufactures LEAP and GE9X jet engines that power Boeing and Airbus aircraft. It holds roughly 40% of the commercial engine market alongside CFM International. Its aftermarket services business — parts and maintenance — generates high-margin recurring revenue.",

  Honeywell:
    "Honeywell is a diversified industrial conglomerate with divisions in aerospace avionics, building automation, performance materials, and warehouse robotics. Its aerospace division supplies cockpit systems, turbines, and connectivity hardware to commercial and business aviation. The company has been evaluating splitting its segments.",

  Albemarle:
    "Albemarle is the world's largest lithium producer, supplying battery-grade lithium carbonate and hydroxide to EV battery manufacturers. Its Chilean brine operations and hard-rock mines in Australia give it diversified source exposure. Revenue swings dramatically with lithium spot prices, which have been volatile since 2022.",

  'TE Connectivity':
    "TE Connectivity makes electrical connectors and sensors used in automotive, industrial, and aerospace applications. Its products enable wire harnesses, sensor integration, and power management in vehicles — with EV content per vehicle roughly double that of internal combustion cars. Automotive is its largest and fastest-growing segment.",

  Amazon:
    "Amazon operates e-commerce, cloud computing (AWS), advertising, and logistics businesses. AWS — the dominant cloud infrastructure platform — generates most of the company's operating profit. Amazon is simultaneously the world's largest logistics operator and a major consumer electronics brand (Alexa, Kindle, Ring).",

  Meta:
    "Meta owns Facebook, Instagram, and WhatsApp, together reaching roughly 3 billion daily users. Nearly all revenue comes from digital advertising sold against this audience. Its heavy investment in AI and the metaverse (Reality Labs) has generated significant operating losses in that division.",

  Google:
    "Alphabet's Google division dominates search advertising and operates YouTube, Chrome, Android, and Google Cloud. Search and advertising represent roughly 75% of revenue. Google Cloud is the third-largest cloud platform and is growing rapidly on the back of AI workloads.",

  Microsoft:
    "Microsoft operates cloud services (Azure), productivity software (Office 365), gaming (Xbox), and LinkedIn. Azure is the second-largest cloud platform and Microsoft's fastest-growing business. Its $13 billion investment in OpenAI has positioned it as the leading enterprise AI platform vendor.",

  UPS:
    "UPS is the world's largest package delivery company by revenue, operating ground, air, and international logistics networks. Its B2B segment serves healthcare, retail, and manufacturing shippers. E-commerce growth has increased residential delivery volume but at lower margins than its commercial routes.",

  FedEx:
    "FedEx operates express air delivery, ground parcel, and freight forwarding networks globally. Its FedEx Express air network is the world's largest cargo airline. A long-running cost reduction program aims to merge ground and express operations to close a profitability gap with UPS.",

  Tesla:
    "Tesla manufactures electric vehicles, energy storage systems, and solar products. Its Gigafactories in Texas, Germany, and China give it vertically integrated production capability. Autopilot and Full Self-Driving software, along with energy storage, are expected to drive future margin expansion beyond vehicle sales.",

  Ford:
    "Ford Motor Company makes trucks, SUVs, and EVs under the Ford and Lincoln brands. The F-Series pickup truck is the best-selling vehicle in the US and the main profit engine of the company. Ford's EV division (Model e) has incurred heavy losses as it scales battery electric production.",

  GM:
    "General Motors produces Chevrolet, Buick, GMC, and Cadillac vehicles across 10 countries. Its Ultium battery platform underpins its EV lineup including the Silverado EV and Blazer EV. Cruise, its autonomous vehicle subsidiary, has faced regulatory and operational setbacks.",

  'LG Energy Solution':
    "LG Energy Solution is one of the world's largest EV battery manufacturers, supplying cells to GM, Hyundai, and Stellantis. It operates joint ventures with GM (Ultium Cells) in the US and with other OEMs in Europe and Asia. Battery cell chemistry and cost per kWh are its primary competitive levers.",

  Volkswagen:
    "Volkswagen Group is Europe's largest automaker, selling vehicles under VW, Audi, Porsche, Lamborghini, and Škoda brands. Its pivot to EVs — backed by a €180 billion investment plan — has been complicated by software problems in its ID. lineup. Labor disputes and plant consolidation in Germany have made it politically contentious.",

  Stellantis:
    "Stellantis is the fourth-largest automaker globally, formed from the merger of PSA and Fiat Chrysler. Its brands include Jeep, Ram, Dodge, Chrysler, Peugeot, and Citroën. North American truck and Jeep profitability subsidizes its European and South American operations.",

  Autoliv:
    "Autoliv is the world's largest maker of automotive safety systems — airbags and seatbelts — supplying every major OEM. Its revenue tracks global vehicle production volume closely. Electrification modestly benefits it, as EV platforms still require full passive safety systems.",

  BWA:
    "BorgWarner supplies propulsion systems and thermal management components for combustion and electric vehicles. It has been repositioning its portfolio toward EV drivetrain components as demand for traditional transmission parts declines. Its Delphi Technologies acquisition added electric power electronics capabilities.",

  APTV:
    "Aptiv designs electrical architecture systems — wire harnesses, connectors, and central computing modules — for next-generation vehicles. Its high-voltage architecture products are in high demand as EVs require significantly more complex electrical distribution than combustion vehicles. It spun off Delphi Technologies in 2017.",

  Panasonic:
    "Panasonic manufactures cylindrical lithium-ion battery cells at its Gigafactory partnership with Tesla in Nevada. It is one of Tesla's longest-standing cell suppliers and is building new independent cell capacity in Kansas. Its battery business has grown to be its most strategically important segment.",

  CATL:
    "Contemporary Amperex Technology (CATL) is the world's largest EV battery manufacturer by volume, supplying Tesla, BMW, Volkswagen, and dozens of Chinese OEMs. Its LFP and NCM chemistries dominate global cell production. Western governments have moved to limit CATL's expansion in North America and Europe.",

  'Samsung SDI':
    "Samsung SDI produces lithium-ion battery cells for EVs, consumer electronics, and energy storage systems. It supplies BMW, Stellantis, and Rivian, and is building joint venture cell plants in the US. Its prismatic and cylindrical cell formats compete with CATL and LG Energy Solution.",

  Toyota:
    "Toyota is the world's largest automaker by volume, known for production efficiency and the Toyota Production System. Its hybrid drivetrain technology (Prius, RAV4 Hybrid) generates strong margins in a segment overlooked by pure-EV competitors. Its bet on solid-state batteries and hydrogen fuel cells is a longer-horizon play.",

  BYD:
    "BYD is China's largest EV manufacturer and CATL's primary domestic competitor, building both its own vehicles and battery cells. It has become the world's top-selling EV brand by volume, surpassing Tesla in 2023. Its vertically integrated model — owning chip design, batteries, and assembly — gives it a cost advantage.",

  CLS:
    "Celestica is an electronics manufacturing services (EMS) company that builds servers, networking hardware, and medical devices for OEM customers. It has gained significant exposure to AI infrastructure by manufacturing hyperscaler network switches. Revenue is highly dependent on capital spending decisions at cloud providers.",

  IBM:
    "IBM provides hybrid cloud infrastructure, AI software (Watson), and consulting services to enterprise customers. Its mainframe business — still used by the majority of Fortune 500 companies for core transaction processing — generates high-margin recurring revenue. The 2019 Red Hat acquisition is central to its cloud strategy.",

  Dell:
    "Dell Technologies sells PCs, servers, storage, and networking infrastructure. Its PowerEdge server line is a major beneficiary of AI infrastructure buildout, with GPU-dense configurations in high demand. Its relationship with VMware (now Broadcom-owned) through channel sales remains significant.",

  HPE:
    "Hewlett Packard Enterprise sells servers, networking gear, and hybrid cloud infrastructure. Its GreenLake platform offers on-premise infrastructure as a subscription service. HPE's Cray supercomputer and Slingshot networking businesses serve high-performance computing and AI research markets.",

  'Super Micro':
    "Super Micro Computer designs and manufactures high-density server and storage systems optimized for AI and GPU workloads. Its liquid-cooled rack-scale systems are used by hyperscalers and enterprises deploying Nvidia GPUs. Accounting irregularities in 2024 created financial reporting delays and management changes.",

  'Arista Networks':
    "Arista Networks makes cloud networking switches and software for hyperscale data centers and financial trading firms. Microsoft and Meta are among its largest customers. Its EOS operating system and merchant silicon strategy give it a cost and programmability advantage over Cisco in cloud environments.",
}
