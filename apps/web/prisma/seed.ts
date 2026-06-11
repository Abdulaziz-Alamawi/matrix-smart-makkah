// Matrix Smart Makkah — database seed.
// Populates PostgreSQL with districts and a live snapshot of telemetry.
// Author: Abdulaziz AlAmawi
import { PrismaClient } from "@prisma/client";
import { DISTRICTS } from "../src/lib/districts";
import { buildSnapshot } from "../src/lib/data-engine";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Matrix Smart Makkah …");
  const snap = buildSnapshot(new Date());

  // Districts
  for (const d of DISTRICTS) {
    await prisma.district.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        name: d.name,
        nameAr: d.nameAr,
        lat: d.center.lat,
        lng: d.center.lng,
        population: d.population,
      },
    });
  }
  console.log(`  ✓ ${DISTRICTS.length} districts`);

  // Waste bins + initial readings
  for (const b of snap.bins) {
    await prisma.wasteBin.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        code: b.code,
        districtId: b.districtId,
        lat: b.location.lat,
        lng: b.location.lng,
        capacityLiters: b.capacityLiters,
        status: b.status,
      },
    });
    await prisma.wasteReading.create({
      data: {
        binId: b.id,
        fillLevel: b.fillLevel,
        temperatureC: b.temperatureC,
        batteryPct: b.batteryPct,
        fillRatePerHour: b.fillRatePerHour,
        predictedFullAt: new Date(b.predictedFullAt),
      },
    });
  }
  console.log(`  ✓ ${snap.bins.length} waste bins`);

  // Traffic segments + readings
  for (const s of snap.segments) {
    await prisma.trafficSegment.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        districtId: s.districtId,
        fromLat: s.from.lat,
        fromLng: s.from.lng,
        toLat: s.to.lat,
        toLng: s.to.lng,
        freeFlowKmh: s.freeFlowKmh,
      },
    });
    await prisma.trafficReading.create({
      data: {
        segmentId: s.id,
        speedKmh: s.speedKmh,
        congestionIndex: s.congestionIndex,
        vehiclesPerHour: s.vehiclesPerHour,
        status: s.status,
      },
    });
  }
  console.log(`  ✓ ${snap.segments.length} traffic segments`);

  // Environment stations + readings
  for (const st of snap.stations) {
    await prisma.environmentStation.upsert({
      where: { id: st.id },
      update: {},
      create: {
        id: st.id,
        name: st.name,
        districtId: st.districtId,
        lat: st.location.lat,
        lng: st.location.lng,
      },
    });
    await prisma.environmentReading.create({
      data: {
        stationId: st.id,
        aqi: st.aqi,
        pm25: st.pm25,
        pm10: st.pm10,
        co2: st.co2,
        noiseDb: st.noiseDb,
        temperatureC: st.temperatureC,
        humidityPct: st.humidityPct,
        status: st.status,
      },
    });
  }
  console.log(`  ✓ ${snap.stations.length} environment stations`);

  // Incidents
  for (const i of snap.incidents) {
    await prisma.incident.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        type: i.type,
        districtId: i.districtId,
        lat: i.location.lat,
        lng: i.location.lng,
        severity: i.severity,
        title: i.title,
        detail: i.detail,
        status: i.status,
        responseUnits: i.responseUnits,
        etaMin: i.etaMin,
        aiConfidence: i.aiConfidence,
        reportedAt: new Date(i.reportedAt),
      },
    });
  }
  console.log(`  ✓ ${snap.incidents.length} incidents`);

  // Risk scores
  for (const r of snap.risk) {
    await prisma.riskScore.create({
      data: {
        districtId: r.districtId,
        floodRisk: r.floodRisk,
        fireRisk: r.fireRisk,
        crowdRisk: r.crowdRisk,
        overall: r.overall,
        drivers: r.drivers,
      },
    });
  }
  console.log(`  ✓ ${snap.risk.length} risk scores`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
