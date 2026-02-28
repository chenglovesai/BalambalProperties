import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DISTRICT_GRADES: Record<string, string> = {
  Central: "A",
  "Wan Chai": "B",
  "Causeway Bay": "A",
  "Tsim Sha Tsui": "A",
  "Mong Kok": "B",
  "Kwun Tong": "B",
  "Kwai Chung": "C",
  "Sheung Wan": "B",
  "Sai Ying Pun": "B",
  "North Point": "B",
  "Quarry Bay": "B",
  "Tai Koo": "B",
  "Kennedy Town": "B",
  Aberdeen: "B",
  Jordan: "C",
  "Yau Ma Tei": "C",
  "Sham Shui Po": "C",
  "Cheung Sha Wan": "C",
  "Lai Chi Kok": "C",
  "Fo Tan": "C",
  "Sha Tin": "B",
  "Tuen Mun": "C",
  "Yuen Long": "C",
  "Tai Po": "C",
  Fanling: "C",
  "Tsuen Wan": "C",
  "Tseung Kwan O": "B",
  "Wong Tai Sin": "C",
  "Diamond Hill": "B",
  "Hung Hom": "B",
  "Kowloon Bay": "B",
  "San Po Kong": "C",
  "Chai Wan": "C",
  "Shau Kei Wan": "C",
  "Ap Lei Chau": "B",
  "Tin Hau": "B",
  "Fortress Hill": "B",
};

const MTR_STATIONS: Record<string, string> = {
  Central: "2 min walk to Central MTR",
  "Wan Chai": "3 min walk to Wan Chai MTR",
  "Causeway Bay": "2 min walk to Causeway Bay MTR",
  "Tsim Sha Tsui": "3 min walk to TST MTR",
  "Mong Kok": "2 min walk to Mong Kok MTR",
  "Kwun Tong": "4 min walk to Kwun Tong MTR",
  "Kwai Chung": "6 min walk to Kwai Hing MTR",
  "Sheung Wan": "3 min walk to Sheung Wan MTR",
  "Sai Ying Pun": "4 min walk to Sai Ying Pun MTR",
  "North Point": "3 min walk to North Point MTR",
  Jordan: "2 min walk to Jordan MTR",
  "Yau Ma Tei": "3 min walk to Yau Ma Tei MTR",
  "Sham Shui Po": "3 min walk to Sham Shui Po MTR",
  "Cheung Sha Wan": "5 min walk to Lai Chi Kok MTR",
  "Fo Tan": "5 min walk to Fo Tan MTR",
  Aberdeen: "8 min bus to Wong Chuk Hang MTR",
  "Tuen Mun": "5 min walk to Tuen Mun MTR",
  "Tsuen Wan": "4 min walk to Tsuen Wan MTR",
  "Sha Tin": "4 min walk to Sha Tin MTR",
  "Quarry Bay": "3 min walk to Quarry Bay MTR",
  "Tai Koo": "2 min walk to Tai Koo MTR",
  "Kennedy Town": "4 min walk to Kennedy Town MTR",
  "Kowloon Bay": "3 min walk to Kowloon Bay MTR",
  "Tseung Kwan O": "4 min walk to TKO MTR",
  "Diamond Hill": "3 min walk to Diamond Hill MTR",
  "Hung Hom": "4 min walk to Hung Hom MTR",
  "Wong Tai Sin": "3 min walk to Wong Tai Sin MTR",
  "Tin Hau": "2 min walk to Tin Hau MTR",
  "Fortress Hill": "2 min walk to Fortress Hill MTR",
  "Chai Wan": "4 min walk to Chai Wan MTR",
};

function inferCeilingHeight(propertyType: string, grade: string): number {
  const base: Record<string, number> = {
    warehouse: 4.2,
    industrial: 4.0,
    fnb: 3.3,
    retail: 3.2,
    office: 2.7,
  };
  const h = base[propertyType] ?? 3.0;
  if (grade === "A") return h + 0.3;
  if (grade === "C") return h - 0.2;
  return h;
}

function inferManagementFee(
  monthlyRent: number | null,
  grossArea: number | null,
  grade: string,
): number | null {
  if (!monthlyRent && !grossArea) return null;
  if (grossArea) {
    const rate = grade === "A" ? 5.5 : grade === "B" ? 3.5 : 2.5;
    return Math.round(grossArea * rate);
  }
  if (monthlyRent) {
    const pct = grade === "A" ? 0.08 : grade === "B" ? 0.06 : 0.04;
    return Math.round(monthlyRent * pct);
  }
  return null;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function inferAiScore(
  district: string,
  propertyType: string,
  grade: string,
  id: string,
): number {
  let base = 50;
  if (grade === "A") base += 15;
  else if (grade === "B") base += 5;
  else base -= 5;

  if (["Central", "Tsim Sha Tsui", "Causeway Bay"].includes(district)) base += 8;
  else if (["Wan Chai", "Mong Kok", "Kwun Tong"].includes(district)) base += 3;

  if (propertyType === "office") base += 3;
  else if (propertyType === "retail") base += 2;

  const variation = (hashCode(id) % 21) - 10;
  return Math.max(20, Math.min(95, base + variation));
}

function inferFeatures(
  propertyType: string,
  description: string,
  grade: string,
): Record<string, unknown> {
  const desc = description.toLowerCase();
  const features: Record<string, unknown> = {};

  if (desc.includes("air con") || desc.includes("a/c") || desc.includes("hvac") || grade === "A") {
    features.aircon = true;
  }
  if (desc.includes("renovate") || desc.includes("refurbish") || desc.includes("newly")) {
    features.renovation = "recent";
  }
  if (desc.includes("lift") || desc.includes("elevator")) features.liftAccess = true;
  if (desc.includes("mtr") || desc.includes("near station")) features.mtrNearby = true;
  if (desc.includes("parking") || desc.includes("car park")) features.parking = true;
  if (desc.includes("24") || desc.includes("round the clock")) features.twentyFourHourAccess = true;
  if (desc.includes("view") || desc.includes("harbour") || desc.includes("sea")) features.view = true;

  if (propertyType === "fnb" || propertyType === "restaurant") {
    if (desc.includes("exhaust") || desc.includes("ventilat")) features.exhaustSystem = true;
    if (desc.includes("grease") || desc.includes("trap")) features.greaseTrap = true;
    if (desc.includes("kitchen")) features.kitchen = true;
  }
  if (propertyType === "warehouse" || propertyType === "industrial") {
    if (desc.includes("loading") || desc.includes("dock")) features.loadingAccess = true;
    if (desc.includes("3-phase") || desc.includes("three phase") || desc.includes("power")) features.threePhasePower = true;
    if (desc.includes("goods lift") || desc.includes("freight")) features.goodsLift = true;
  }
  if (propertyType === "retail") {
    if (desc.includes("frontage") || desc.includes("street")) features.streetFrontage = true;
    if (desc.includes("ground") || desc.includes("g/f")) features.groundFloor = true;
  }
  if (propertyType === "office") {
    if (desc.includes("open") || desc.includes("open-plan")) features.openPlan = true;
    if (desc.includes("fitted") || desc.includes("furnished")) features.fitted = true;
    if (desc.includes("fibre") || desc.includes("internet") || desc.includes("broadband")) features.fibreOptic = true;
  }

  if (Object.keys(features).length === 0) {
    features[propertyType] = true;
  }

  return features;
}

function inferSaleableArea(grossArea: number | null, propertyType: string): number | null {
  if (!grossArea) return null;
  const efficiency: Record<string, number> = {
    office: 0.75,
    retail: 0.82,
    fnb: 0.80,
    warehouse: 0.90,
    industrial: 0.88,
  };
  return Math.round(grossArea * (efficiency[propertyType] ?? 0.80));
}

async function main() {
  const batchSize = 100;
  let offset = 0;
  let totalUpdated = 0;

  const total = await prisma.property.count({ where: { status: "active" } });
  console.log(`Enriching ${total} properties...`);

  while (offset < total) {
    const properties = await prisma.property.findMany({
      where: { status: "active" },
      skip: offset,
      take: batchSize,
      select: {
        id: true,
        district: true,
        propertyType: true,
        description: true,
        monthlyRent: true,
        grossArea: true,
        saleableArea: true,
        managementFee: true,
        buildingGrade: true,
        aiScore: true,
        ceilingHeight: true,
        mtrProximity: true,
        features: true,
      },
    });

    for (const p of properties) {
      const grade = p.buildingGrade || DISTRICT_GRADES[p.district] || "C";
      const updates: Record<string, unknown> = {};

      if (!p.buildingGrade) updates.buildingGrade = grade;
      if (!p.managementFee) {
        updates.managementFee = inferManagementFee(p.monthlyRent, p.grossArea, grade);
      }
      if (!p.saleableArea && p.grossArea) {
        updates.saleableArea = inferSaleableArea(p.grossArea, p.propertyType);
      }
      if (p.aiScore == null) {
        updates.aiScore = inferAiScore(p.district, p.propertyType, grade, p.id);
      }
      if (p.ceilingHeight == null) {
        updates.ceilingHeight = inferCeilingHeight(p.propertyType, grade);
      }
      if (!p.mtrProximity) {
        updates.mtrProximity = MTR_STATIONS[p.district] || `10+ min to nearest MTR`;
      }
      if (!p.features) {
        updates.features = inferFeatures(p.propertyType, p.description, grade);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.property.update({
          where: { id: p.id },
          data: updates,
        });
        totalUpdated++;
      }
    }

    offset += batchSize;
    console.log(`  Processed ${Math.min(offset, total)}/${total} (${totalUpdated} updated)`);
  }

  console.log(`\nDone. Enriched ${totalUpdated} properties.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
