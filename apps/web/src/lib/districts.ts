import type { District } from "./types";

// Approximate geographic anchors for Makkah districts (Holy City).
export const MAKKAH_CENTER = { lat: 21.4225, lng: 39.8262 };

export const DISTRICTS: District[] = [
  {
    id: "haram",
    name: "Al Haram",
    nameAr: "المسجد الحرام",
    center: { lat: 21.4225, lng: 39.8262 },
    population: 95000,
  },
  {
    id: "aziziyah",
    name: "Al Aziziyah",
    nameAr: "العزيزية",
    center: { lat: 21.4106, lng: 39.8714 },
    population: 210000,
  },
  {
    id: "ajyad",
    name: "Ajyad",
    nameAr: "أجياد",
    center: { lat: 21.4155, lng: 39.8295 },
    population: 64000,
  },
  {
    id: "misfalah",
    name: "Al Misfalah",
    nameAr: "المسفلة",
    center: { lat: 21.4131, lng: 39.8196 },
    population: 88000,
  },
  {
    id: "awali",
    name: "Al Awali",
    nameAr: "العوالي",
    center: { lat: 21.3548, lng: 39.8869 },
    population: 156000,
  },
  {
    id: "sharaye",
    name: "Al Sharaye",
    nameAr: "الشرائع",
    center: { lat: 21.4986, lng: 39.9457 },
    population: 240000,
  },
  {
    id: "mina",
    name: "Mina",
    nameAr: "منى",
    center: { lat: 21.4133, lng: 39.8933 },
    population: 50000,
  },
  {
    id: "arafat",
    name: "Arafat",
    nameAr: "عرفات",
    center: { lat: 21.3551, lng: 39.9843 },
    population: 30000,
  },
];

export function districtById(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id);
}
