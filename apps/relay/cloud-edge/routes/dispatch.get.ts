import { GeoEdgeDispatcher } from "@src/geo-dispatcher";
import { defineEventHandler, getHeader, getQuery } from "h3";

const dispatcher = new GeoEdgeDispatcher();

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const countryHeader =
    getHeader(event, "cf-ipcountry") || getHeader(event, "x-country-code");

  if (typeof query.lat === "string" && typeof query.lon === "string") {
    const lat = Number.parseFloat(query.lat);
    const lon = Number.parseFloat(query.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return dispatcher.dispatchByCoordinates(lat, lon);
    }
  }

  const country =
    typeof query.country === "string" ? query.country : countryHeader;
  return dispatcher.dispatchByCountry(country);
});
