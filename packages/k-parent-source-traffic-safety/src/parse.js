const { normalizeInstitution, normalizeSourceMetadata } = require("k-parent-core");

function extractItems(payload) {
  const body = payload?.response?.body ?? payload?.body ?? payload;
  let items = body?.items;

  if (items && !Array.isArray(items) && items.item !== undefined) {
    items = items.item;
  }
  if (Array.isArray(items)) return items;
  if (items && typeof items === "object") return [items];
  if (Array.isArray(body?.data)) return body.data;
  return [];
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return null;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function makeSource(name, options = {}) {
  return normalizeSourceMetadata({
    sourceName: name,
    sourceType: "official",
    sourceUrl: options.sourceUrl || (options.sourcePath ? `http://apis.data.go.kr${options.sourcePath}` : null),
    fetchedAt: options.fetchedAt || new Date(),
    now: options.now,
    maxAgeHours: options.maxAgeHours == null ? 24 : options.maxAgeHours,
  });
}

function normalizeSchoolZoneRisk(payload, options = {}) {
  const source = makeSource("도로교통공단 어린이보호구역 사고다발지역", options);
  return extractItems(payload).map((row) => {
    const name = pick(row, ["spot_nm", "spotNm", "sptNm", "acc_rgn_nm", "accRgnNm", "name"]) || "어린이보호구역 사고다발지역";
    const address = pick(row, ["spot_addr", "spotAddr", "addr", "rdnmadr", "lnmadr"]);
    const institution = normalizeInstitution({
      id: pick(row, ["afos_fid", "afosFid", "spot_cd", "spotCd", "id"]),
      type: "school_zone_risk",
      name,
      address,
      latitude: toNumberOrNull(pick(row, ["la_crd", "laCrd", "lat", "latitude", "y"])),
      longitude: toNumberOrNull(pick(row, ["lo_crd", "loCrd", "lon", "lng", "longitude", "x"])),
      source,
      updatedAt: pick(row, ["crtr_ymd", "crtrYmd", "referenceDate"]),
    });
    return {
      ...institution,
      accidentCount: toNumberOrNull(pick(row, ["occrrnc_cnt", "occrrncCnt", "accidentCount"])),
      casualtyCount: toNumberOrNull(pick(row, ["caslt_cnt", "casltCnt", "casualtyCount"])),
      targetFacility: pick(row, ["faclt_nm", "facltNm", "schulNm", "targetFacility"]),
      raw: row,
    };
  });
}

function normalizeProtectionZones(payload, options = {}) {
  const source = makeSource("어린이보호구역", options);
  return extractItems(payload).map((row) => {
    const name = pick(row, ["fcltyNm", "facltNm", "trgtFcltsNm", "targetFacilityName", "schoolName", "name"]) || "어린이보호구역";
    const address = pick(row, ["rdnmadr", "rnAdres", "lnmadr", "lnoAdres", "adres", "addr", "address"]);
    const institution = normalizeInstitution({
      id: pick(row, ["mngNo", "zoneId", "id", "sn"]),
      type: "school_zone",
      name,
      address,
      latitude: toNumberOrNull(pick(row, ["latitude", "lat", "la", "yCrdnt"])),
      longitude: toNumberOrNull(pick(row, ["longitude", "lng", "lo", "xCrdnt"])),
      source,
      updatedAt: pick(row, ["referenceDate", "crtrYmd", "stdrDe"]),
    });
    return {
      ...institution,
      facilityType: pick(row, ["fcltyTy", "facltTy", "trgtFcltsSe", "targetFacilityType"]),
      policeStation: pick(row, ["polcsttnNm", "policeStation", "jurisdPoliceStation"]),
      cctvInstalled: pick(row, ["cctvYn", "cctvInstlAt", "cctvInstalled"]),
      cctvCount: toNumberOrNull(pick(row, ["cctvCo", "cctvCnt", "cctvCount"])),
      managingAgency: pick(row, ["mngInsttNm", "manageInstNm", "institutionNm"]),
      raw: row,
    };
  });
}

function normalizeYellowCarpets(payload, options = {}) {
  const source = makeSource("옐로카펫", options);
  return extractItems(payload).map((row) => {
    const name = pick(row, ["instlLc", "installationLocation", "spotNm", "name"]) || "옐로카펫";
    const address = pick(row, ["rdnmadr", "lnmadr", "addr", "address"]);
    const institution = normalizeInstitution({
      id: pick(row, ["sn", "mngNo", "id"]),
      type: "yellow_carpet",
      name,
      address,
      latitude: toNumberOrNull(pick(row, ["latitude", "lat", "la"])),
      longitude: toNumberOrNull(pick(row, ["longitude", "lng", "lo"])),
      source,
      updatedAt: pick(row, ["referenceDate", "crtrYmd", "stdrDe"]),
    });
    return {
      ...institution,
      installedAt: pick(row, ["instlDe", "installDate", "installedAt"]),
      managingAgency: pick(row, ["mngInsttNm", "manageInstNm", "institutionNm"]),
      raw: row,
    };
  });
}

module.exports = {
  extractItems,
  normalizeSchoolZoneRisk,
  normalizeProtectionZones,
  normalizeYellowCarpets,
};
