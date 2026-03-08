import { EU_COUNTRIES } from "../config/regions.js"

export function detectRegion(cf = {}) {
  const countries = Array.isArray(EU_COUNTRIES) ? EU_COUNTRIES : []

  if (cf.isEUCountry === "1" || cf.isEUCountry === true) return "eu"
  if (countries.includes(cf.country)) return "eu"
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
    isEU       : cf.isEUCountry === "1" || cf.isEUCountry === true
  }
}
