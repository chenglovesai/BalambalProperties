import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PROPERTIES = [
  {
    title: "Prime Ground Floor Retail Unit - Nathan Road",
    description: "Excellent ground floor retail space on Nathan Road with wide frontage and heavy foot traffic. Recently renovated with modern finishes. Suitable for retail or F&B use. Air conditioning included. Near MTR station.",
    district: "Mong Kok",
    address: "123 Nathan Road, Mong Kok",
    propertyType: "retail",
    saleableArea: 650,
    grossArea: 800,
    monthlyRent: 85000,
    psfRent: 131,
    managementFee: 3500,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"],
    latitude: 22.3193,
    longitude: 114.1694,
    engagementScore: 92,
    features: { frontage: "wide", aircon: true, renovation: "recent", mtrNearby: true },
  },
  {
    title: "Industrial Kitchen Space with Exhaust System",
    description: "Purpose-built F&B space in a commercial building with existing ventilation and exhaust system. FEHD licensing previously approved for restaurant use. Includes grease trap and fire suppression system. Ground floor with rear loading access.",
    district: "Kwai Chung",
    address: "Unit G5, Kwai Chung Industrial Centre",
    propertyType: "fnb",
    saleableArea: 1200,
    grossArea: 1450,
    monthlyRent: 45000,
    psfRent: 38,
    managementFee: 5000,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"],
    latitude: 22.3569,
    longitude: 114.1306,
    engagementScore: 78,
    features: { exhaustSystem: true, greaseTrap: true, fehdApproved: true, loadingAccess: true },
  },
  {
    title: "Modern Office Suite - Central Business District",
    description: "Grade A office space in the heart of Central with harbour views. 24/7 access, dedicated lift lobby, and premium building management. Fitted with raised flooring, centralized HVAC, and fiber optic connectivity.",
    district: "Central",
    address: "18/F, One Exchange Square, Central",
    propertyType: "office",
    saleableArea: 2500,
    grossArea: 3200,
    monthlyRent: 175000,
    psfRent: 70,
    managementFee: 15000,
    floor: "18/F",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
    latitude: 22.2833,
    longitude: 114.1588,
    engagementScore: 88,
    features: { harbourView: true, twentyFourHourAccess: true, gradeA: true, fibreOptic: true },
  },
  {
    title: "Warehouse with Loading Dock - Kwai Chung Container Port",
    description: "Logistics-grade warehouse space near Kwai Chung container terminal. Features 4.5m clear ceiling height, reinforced flooring for heavy goods, and direct access to a shared loading dock. 3-phase power supply available.",
    district: "Kwai Chung",
    address: "Block B, Kwai Chung Logistics Centre, Container Port Road",
    propertyType: "warehouse",
    saleableArea: 5000,
    grossArea: 5500,
    monthlyRent: 65000,
    psfRent: 13,
    managementFee: 8000,
    floor: "2/F",
    images: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800"],
    latitude: 22.3491,
    longitude: 114.1186,
    engagementScore: 65,
    features: { ceilingHeight: 4.5, reinforcedFloor: true, loadingDock: true, threePhasePower: true },
  },
  {
    title: "Cozy Café Space in Sheung Wan",
    description: "Charming ground floor unit in a walk-up building in Sheung Wan, perfect for a specialty café or small bakery. Existing exhaust duct available. Near PMQ and art galleries. Good pedestrian flow on weekends.",
    district: "Sheung Wan",
    address: "62 Hollywood Road, Sheung Wan",
    propertyType: "fnb",
    saleableArea: 350,
    grossArea: 420,
    monthlyRent: 38000,
    psfRent: 109,
    managementFee: 2000,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"],
    latitude: 22.2838,
    longitude: 114.1505,
    engagementScore: 71,
    features: { exhaustDuct: true, walkUp: true, pedestrianFlow: "good" },
  },
  {
    title: "Spacious Retail Unit - Tsim Sha Tsui",
    description: "Double-fronted retail space on Canton Road. High visibility location near luxury hotels and major shopping malls. Premium foot traffic area. Suitable for fashion, electronics, or lifestyle retail. MVAC system included.",
    district: "Tsim Sha Tsui",
    address: "88 Canton Road, Tsim Sha Tsui",
    propertyType: "retail",
    saleableArea: 1800,
    grossArea: 2100,
    monthlyRent: 220000,
    psfRent: 122,
    managementFee: 12000,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"],
    latitude: 22.2966,
    longitude: 114.1677,
    engagementScore: 95,
    features: { doubleFrontage: true, highVisibility: true, mvacSystem: true },
  },
  {
    title: "Startup-Friendly Office - Wan Chai",
    description: "Affordable fitted office space suitable for startups and small teams. Open-plan layout with meeting room. Building has 24/7 access and building management. Near Wan Chai MTR with convenient transportation links.",
    district: "Wan Chai",
    address: "15/F, Hennessy Road Commercial Building",
    propertyType: "office",
    saleableArea: 800,
    grossArea: 1050,
    monthlyRent: 28000,
    psfRent: 35,
    managementFee: 4500,
    floor: "15/F",
    images: ["https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800"],
    latitude: 22.2783,
    longitude: 114.1747,
    engagementScore: 82,
    features: { fitted: true, openPlan: true, twentyFourHourAccess: true, mtrNearby: true },
  },
  {
    title: "Central Kitchen with Cold Storage - Fo Tan",
    description: "Industrial building unit converted for central kitchen use with existing cold storage rooms. Three-phase power supply and ventilation system installed. Goods lift access. Previous F&B manufacturing license held.",
    district: "Fo Tan",
    address: "Unit 12A, Fo Tan Industrial Estate",
    propertyType: "fnb",
    saleableArea: 2200,
    grossArea: 2600,
    monthlyRent: 42000,
    psfRent: 19,
    managementFee: 4000,
    floor: "5/F",
    images: ["https://images.unsplash.com/photo-1577308856961-8e9ec50d0c67?w=800"],
    latitude: 22.3955,
    longitude: 114.1956,
    engagementScore: 58,
    features: { coldStorage: true, threePhasePower: true, ventilation: true, goodsLift: true },
  },
  {
    title: "Corner Shop in Causeway Bay",
    description: "High-traffic corner retail unit in Causeway Bay shopping district. Two-sided frontage maximizing visibility. Suitable for cosmetics, accessories, or F&B takeaway. Near Times Square and Sogo Department Store.",
    district: "Causeway Bay",
    address: "1 Jardine's Crescent, Causeway Bay",
    propertyType: "retail",
    saleableArea: 480,
    grossArea: 580,
    monthlyRent: 95000,
    psfRent: 198,
    managementFee: 5000,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
    latitude: 22.2793,
    longitude: 114.1851,
    engagementScore: 89,
    features: { cornerUnit: true, doubleFrontage: true, highTraffic: true },
  },
  {
    title: "Cold Chain Warehouse - Tuen Mun",
    description: "Temperature-controlled warehouse space suitable for cold chain logistics. Features include dock-level loading, 3-phase power, goods lifts rated to 5 tons, and 24/7 security. Easily accessible from Tuen Mun highway.",
    district: "Tuen Mun",
    address: "Tuen Mun Central Logistics Hub, Lung Mun Road",
    propertyType: "warehouse",
    saleableArea: 8000,
    grossArea: 9200,
    monthlyRent: 96000,
    psfRent: 12,
    managementFee: 12000,
    floor: "3/F",
    images: ["https://images.unsplash.com/photo-1553413077-190dd305871c?w=800"],
    latitude: 22.3908,
    longitude: 113.9748,
    engagementScore: 45,
    features: { temperatureControlled: true, dockLevel: true, goodsLiftCapacity: 5, twentyFourHourSecurity: true },
  },
  {
    title: "Boutique Retail Space - Sai Ying Pun",
    description: "Intimate ground floor unit in gentrified Sai Ying Pun area. High ceilings and original architectural features. Ideal for a boutique, art gallery, or lifestyle brand. Near University of Hong Kong MTR exit.",
    district: "Sai Ying Pun",
    address: "32 High Street, Sai Ying Pun",
    propertyType: "retail",
    saleableArea: 400,
    grossArea: 480,
    monthlyRent: 42000,
    psfRent: 105,
    managementFee: 2500,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800"],
    latitude: 22.2865,
    longitude: 114.1430,
    engagementScore: 62,
    features: { highCeiling: true, characterBuilding: true, mtrNearby: true },
  },
  {
    title: "Serviced Office - Kwun Tong Business Area",
    description: "Move-in ready serviced office in a revitalized industrial-commercial building. Furnished with desks, chairs, and IT infrastructure. Shared pantry and meeting rooms. Ideal for growing teams of 5-15 people.",
    district: "Kwun Tong",
    address: "10/F, Millennium City 5, Kwun Tong",
    propertyType: "office",
    saleableArea: 1500,
    grossArea: 1850,
    monthlyRent: 55000,
    psfRent: 37,
    managementFee: 8000,
    floor: "10/F",
    images: ["https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800"],
    latitude: 22.3095,
    longitude: 114.2247,
    engagementScore: 74,
    features: { furnished: true, itInfrastructure: true, sharedFacilities: true },
  },
  {
    title: "Restaurant Space with Terrace - Stanley",
    description: "Rare waterfront restaurant unit with outdoor terrace seating in Stanley. Full kitchen exhaust system and grease trap installed. Previous restaurant operated here for 10+ years. FEHD and liquor license transferable subject to conditions.",
    district: "Aberdeen",
    address: "Stanley Main Street, Stanley",
    propertyType: "fnb",
    saleableArea: 900,
    grossArea: 1100,
    monthlyRent: 72000,
    psfRent: 80,
    managementFee: 6000,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"],
    latitude: 22.2191,
    longitude: 114.2112,
    engagementScore: 84,
    features: { terrace: true, exhaustSystem: true, fehdApproved: true, liquorLicense: true, waterfront: true },
  },
  {
    title: "Mini-Storage Warehouse - Cheung Sha Wan",
    description: "Industrial building unit suitable for mini-storage conversion or e-commerce fulfillment. Goods lift rated to 3 tons. 3-phase power supply. Fire compartmentation in place. Near Lai Chi Kok MTR and major roads.",
    district: "Cheung Sha Wan",
    address: "Cheung Sha Wan Industrial Building, Un Chau Street",
    propertyType: "warehouse",
    saleableArea: 3500,
    grossArea: 4000,
    monthlyRent: 38500,
    psfRent: 11,
    managementFee: 5500,
    floor: "8/F",
    images: ["https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=800"],
    latitude: 22.3375,
    longitude: 114.1535,
    engagementScore: 51,
    features: { goodsLiftCapacity: 3, threePhasePower: true, fireCompartment: true, mtrNearby: true },
  },
  {
    title: "Street-Level Shop - Jordan",
    description: "Busy street-level retail unit on a popular shopping street in Jordan. Narrow but deep layout. Suitable for phone accessories, snack shop, or convenience store. Steady pedestrian traffic throughout the day.",
    district: "Jordan",
    address: "Temple Street, Jordan",
    propertyType: "retail",
    saleableArea: 300,
    grossArea: 380,
    monthlyRent: 35000,
    psfRent: 117,
    managementFee: 1800,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800"],
    latitude: 22.3048,
    longitude: 114.1699,
    engagementScore: 69,
    features: { streetLevel: true, pedestrianTraffic: "steady" },
  },
  {
    title: "Open-Plan Creative Office - North Point",
    description: "Bright open-plan office in a renovated industrial building in North Point. High ceilings, exposed ductwork. Ideal for creative agencies, tech startups, or design studios. Pet-friendly building management.",
    district: "North Point",
    address: "Healthy Street East, North Point",
    propertyType: "office",
    saleableArea: 1800,
    grossArea: 2200,
    monthlyRent: 48000,
    psfRent: 27,
    managementFee: 6000,
    floor: "7/F",
    images: ["https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800"],
    latitude: 22.2914,
    longitude: 114.2022,
    engagementScore: 77,
    features: { openPlan: true, highCeiling: true, creative: true, petFriendly: true },
  },
  {
    title: "Takeaway Kitchen Unit - Sham Shui Po",
    description: "Affordable ground floor unit on a busy street in Sham Shui Po. Previously used as a noodle shop. Basic exhaust duct in place but may need upgrade for full kitchen operation. Strong local demand for affordable food options.",
    district: "Sham Shui Po",
    address: "Kweilin Street, Sham Shui Po",
    propertyType: "fnb",
    saleableArea: 280,
    grossArea: 340,
    monthlyRent: 22000,
    psfRent: 79,
    managementFee: 1500,
    floor: "G/F",
    images: ["https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800"],
    latitude: 22.3307,
    longitude: 114.1621,
    engagementScore: 67,
    features: { basicExhaust: true, previousFnb: true, streetLevel: true },
  },
  {
    title: "Premium Retail Flagship - Central",
    description: "Prestigious street-level retail unit on Queen's Road Central. Triple-height ceiling, floor-to-ceiling glass frontage. Suitable for luxury retail, flagship store, or premium showroom. Full building MVAC and 24/7 security.",
    district: "Central",
    address: "Queen's Road Central",
    propertyType: "retail",
    saleableArea: 3500,
    grossArea: 4200,
    monthlyRent: 450000,
    psfRent: 129,
    managementFee: 25000,
    floor: "G/F-1/F",
    images: ["https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800"],
    latitude: 22.2817,
    longitude: 114.1561,
    engagementScore: 97,
    features: { tripleHeight: true, glassFrontage: true, flagship: true, twentyFourHourSecurity: true },
  },
  {
    title: "Compact Office Near MTR - Tsuen Wan",
    description: "Efficient small office unit near Tsuen Wan MTR station. Fitted with basic partitions, suitable for 2-5 person team. Building has canteen and parking facilities. Affordable option for new businesses.",
    district: "Tsuen Wan",
    address: "Tsuen Wan Centre, Tsuen King Circuit",
    propertyType: "office",
    saleableArea: 450,
    grossArea: 580,
    monthlyRent: 12000,
    psfRent: 27,
    managementFee: 2500,
    floor: "12/F",
    images: ["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800"],
    latitude: 22.3710,
    longitude: 114.1096,
    engagementScore: 55,
    features: { fitted: true, mtrNearby: true, parking: true, canteen: true },
  },
  {
    title: "Multi-Level Retail Space - Yau Ma Tei",
    description: "Two-floor retail space on a busy commercial street in Yau Ma Tei. Ground floor shopfront with basement storage/workshop area. Suitable for fashion retail, café with basement seating, or wellness centre. Near Temple Street Night Market.",
    district: "Yau Ma Tei",
    address: "Shanghai Street, Yau Ma Tei",
    propertyType: "retail",
    saleableArea: 1100,
    grossArea: 1400,
    monthlyRent: 58000,
    psfRent: 53,
    managementFee: 4000,
    floor: "G/F-B/F",
    images: ["https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800"],
    latitude: 22.3065,
    longitude: 114.1681,
    engagementScore: 63,
    features: { multiLevel: true, basementStorage: true, streetFrontage: true },
  },
];

const EVIDENCE_STATUSES = ["verified", "pending", "unconfirmed"] as const;

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvidencePack() {
  const statuses = {
    ownershipStatus: randomChoice(EVIDENCE_STATUSES),
    ownershipSource: Math.random() > 0.5 ? "https://www.landreg.gov.hk/" : null,
    ownershipDate: Math.random() > 0.5 ? new Date() : null,
    floorPlanStatus: randomChoice(EVIDENCE_STATUSES),
    floorPlanSource: Math.random() > 0.6 ? "https://bravo.bd.gov.hk/" : null,
    buildingRecordStatus: randomChoice(EVIDENCE_STATUSES),
    buildingRecordSource: Math.random() > 0.5 ? "https://bravo.bd.gov.hk/" : null,
    tenancyStatus: randomChoice(EVIDENCE_STATUSES),
    tenancyDetail: randomChoice(["Vacant possession", "Subject to existing tenancy expiring 2026-12", "Vacant", null]),
    ubwStatus: randomChoice(EVIDENCE_STATUSES),
    ubwDetail: randomChoice(["No UBW on record", "Minor UBW noted - subdivided unit", "Clear", null]),
  };

  const verified = Object.values(statuses).filter((v) => v === "verified").length;
  const total = 5;
  const completionPct = Math.round((verified / total) * 100);

  return { ...statuses, completionPct };
}

function generateRiskChecks(propertyType: string): Array<{
  sectorType: string;
  checkName: string;
  status: string;
  confidence: number;
  explanation: string;
  recommendation: string;
  sources: string[];
}> {
  const sectorType = propertyType === "retail" ? "retail" : propertyType === "warehouse" ? "warehouse" : "fnb";

  if (sectorType === "fnb") {
    return [
      {
        sectorType: "fnb",
        checkName: "ventilation_exhaust",
        status: randomChoice(["pass", "risk", "unknown"]),
        confidence: 0.6 + Math.random() * 0.3,
        explanation: "Ventilation system assessment based on property description and building records.",
        recommendation: "Request the building's ventilation shaft diagram from the management office before proceeding.",
        sources: ["https://www.fehd.gov.hk/english/licensing/guide.html"],
      },
      {
        sectorType: "fnb",
        checkName: "fire_safety",
        status: randomChoice(["pass", "risk", "unknown"]),
        confidence: 0.5 + Math.random() * 0.3,
        explanation: "Fire safety documentation check based on building records status.",
        recommendation: "Verify current fire safety certificate with the Fire Services Department.",
        sources: ["https://www.hkfsd.gov.hk/eng/source/licensing/"],
      },
      {
        sectorType: "fnb",
        checkName: "fehd_licensing",
        status: randomChoice(["pass", "risk", "unknown"]),
        confidence: 0.5 + Math.random() * 0.4,
        explanation: "FEHD licensing feasibility based on premises layout and building type.",
        recommendation: "Consult FEHD's Guide on Types of Licences Required before finalizing.",
        sources: ["https://www.fehd.gov.hk/english/licensing/guide.html"],
      },
      {
        sectorType: "fnb",
        checkName: "ubw_impact",
        status: randomChoice(["pass", "risk", "unknown"]),
        confidence: 0.4 + Math.random() * 0.4,
        explanation: "Assessment of unauthorized building works impact on license applications.",
        recommendation: "Check BRAVO system for any recorded UBW that could affect licensing.",
        sources: ["https://bravo.bd.gov.hk/"],
      },
    ];
  }

  if (sectorType === "retail") {
    return [
      {
        sectorType: "retail",
        checkName: "signage_shopfront",
        status: randomChoice(["pass", "risk", "unknown"]),
        confidence: 0.5 + Math.random() * 0.4,
        explanation: "Signage and shopfront feasibility under building management rules.",
        recommendation: "Check deed of mutual covenant for signage restrictions.",
        sources: [],
      },
      {
        sectorType: "retail",
        checkName: "planning_compliance",
        status: randomChoice(["pass", "risk"]),
        confidence: 0.6 + Math.random() * 0.3,
        explanation: "Planning condition compliance for commercial use in this building type.",
        recommendation: "Verify the Outline Zoning Plan permits your intended use.",
        sources: [],
      },
      {
        sectorType: "retail",
        checkName: "accessibility",
        status: randomChoice(["pass", "unknown"]),
        confidence: 0.5 + Math.random() * 0.3,
        explanation: "Accessibility requirements assessment for the premises.",
        recommendation: "Ensure the premises meets Design Manual barrier-free access requirements.",
        sources: [],
      },
    ];
  }

  return [
    {
      sectorType: "warehouse",
      checkName: "loading_bay",
      status: randomChoice(["pass", "risk", "unknown"]),
      confidence: 0.6 + Math.random() * 0.3,
      explanation: "Loading bay access assessment based on property description.",
      recommendation: "Visit the property to verify loading bay dimensions and access hours.",
      sources: [],
    },
    {
      sectorType: "warehouse",
      checkName: "goods_lift",
      status: randomChoice(["pass", "risk"]),
      confidence: 0.5 + Math.random() * 0.4,
      explanation: "Goods lift capacity check for the building.",
      recommendation: "Confirm goods lift capacity with building management.",
      sources: [],
    },
    {
      sectorType: "warehouse",
      checkName: "fire_compartment",
      status: randomChoice(["pass", "risk", "unknown"]),
      confidence: 0.5 + Math.random() * 0.3,
      explanation: "Fire compartmentation standards assessment.",
      recommendation: "Verify fire compartmentation compliance with the Fire Services Department.",
      sources: ["https://www.hkfsd.gov.hk/eng/source/licensing/"],
    },
    {
      sectorType: "warehouse",
      checkName: "dangerous_goods",
      status: randomChoice(["pass", "unknown"]),
      confidence: 0.4 + Math.random() * 0.3,
      explanation: "Dangerous goods storage assessment based on available information.",
      recommendation: "If storing dangerous goods, apply for the appropriate license from FSD.",
      sources: ["https://www.hkfsd.gov.hk/eng/source/licensing/"],
    },
  ];
}

async function main() {
  console.log("Seeding database...");

  await prisma.userInteraction.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.riskCheck.deleteMany();
  await prisma.evidencePack.deleteMany();
  await prisma.sourceListing.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const demoPassword = await hash("demo1234", 12);
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@balambal.com",
      name: "Demo User",
      hashedPassword: demoPassword,
      businessType: "fnb",
      businessDesc: "Opening a small café in Hong Kong",
      onboarded: true,
      preferences: {
        businessType: "fnb",
        districts: ["Sheung Wan", "Wan Chai", "Central"],
        budgetMax: 50000,
        areaMin: 300,
        areaMax: 800,
      },
    },
  });

  console.log(`Created demo user: ${demoUser.email} (password: demo1234)`);

  for (const prop of SEED_PROPERTIES) {
    const canonicalId = `HK-${prop.district.replace(/\s/g, "").toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const property = await prisma.property.create({
      data: {
        canonicalId,
        title: prop.title,
        description: prop.description,
        district: prop.district,
        address: prop.address,
        propertyType: prop.propertyType,
        saleableArea: prop.saleableArea,
        grossArea: prop.grossArea,
        monthlyRent: prop.monthlyRent,
        psfRent: prop.psfRent,
        managementFee: prop.managementFee,
        floor: prop.floor,
        images: prop.images,
        latitude: prop.latitude,
        longitude: prop.longitude,
        engagementScore: prop.engagementScore,
        features: prop.features,
        verificationScore: 0,
      },
    });

    await prisma.sourceListing.create({
      data: {
        propertyId: property.id,
        source: randomChoice(["28hse", "spacious", "agent_direct"]),
        sourceUrl: `https://example.com/listing/${canonicalId}`,
        rawData: JSON.parse(JSON.stringify(prop)),
        agentName: randomChoice(["Chan Properties", "Lee Real Estate", "Wong & Associates", "HK Commercial Agency", "Pacific Realty"]),
        agentContact: `agent${Math.floor(Math.random() * 100)}@example.com`,
        scrapedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });

    const ep = generateEvidencePack();
    await prisma.evidencePack.create({
      data: {
        propertyId: property.id,
        ...ep,
      },
    });

    await prisma.property.update({
      where: { id: property.id },
      data: { verificationScore: ep.completionPct },
    });

    const riskChecks = generateRiskChecks(prop.propertyType);
    for (const check of riskChecks) {
      await prisma.riskCheck.create({
        data: {
          propertyId: property.id,
          ...check,
        },
      });
    }

    console.log(`  Created: ${property.title} (${property.district})`);
  }

  console.log(`\nSeeded ${SEED_PROPERTIES.length} properties with evidence packs and risk checks.`);
  console.log("Demo login: demo@balambal.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
