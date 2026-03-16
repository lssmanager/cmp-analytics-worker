import { EU_COUNTRIES } from "./regions.js"

export function detectRegion(cf = {}) {
  if (cf.isEUCountry === "1") return "eu"
  if (EU_COUNTRIES.includes(cf.country)) return "eu"
  if (cf.country === "US") return "us"
  if (cf.country === "CA") return "ca"
  return "global"
}

export function getGeoContext(cf = {}) {
  return {
    country    : cf.country    || null,
    city       : cf.city       || null,
    region     : cf.region     || null,
    regionCode : cf.regionCode || null,
    continent  : cf.continent  || null,
    timezone   : cf.timezone   || null,
    isEU       : cf.isEUCountry === "1"
  }
}
