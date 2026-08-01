function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toBooleanYesNo(value) {
  return String(value || "").trim().toUpperCase() === "Y";
}

function haversineDistanceMeters(latitudeA, longitudeA, latitudeB, longitudeB) {
  const earthRadiusMeters = 6371008.8;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const originLatitude = toRadians(latitudeA);
  const targetLatitude = toRadians(latitudeB);
  const value =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(targetLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getParkingItems(payload) {
  if (Array.isArray(payload)) return payload;
  const items = payload?.response?.body?.items ?? payload?.body?.items ?? payload?.items ?? [];
  if (Array.isArray(items)) return items;
  if (Array.isArray(items.item)) return items.item;
  if (items.item && typeof items.item === "object") return [items.item];
  return [];
}

function normalizeParkingLotRows(payload, origin, options = {}) {
  const latitude = Number(origin?.latitude);
  const longitude = Number(origin?.longitude);
  const publicOnly = options.publicOnly !== false;
  const maxDistanceMeters = Number.isFinite(Number(options.radius ?? options.maxDistanceMeters))
    ? Number(options.radius ?? options.maxDistanceMeters)
    : null;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("normalizeParkingLotRows requires finite origin coordinates.");
  }

  const items = getParkingItems(payload)
    .filter((row) => !publicOnly || String(row.prkplceSe || row["주차장구분"] || "").trim() === "공영")
    .map((row) => {
      const itemLatitude = toNumber(row.latitude ?? row["위도"]);
      const itemLongitude = toNumber(row.longitude ?? row["경도"]);
      if (!Number.isFinite(itemLatitude) || !Number.isFinite(itemLongitude)) return null;

      const name = String(row.prkplceNm ?? row["주차장명"] ?? "").trim();
      const roadAddress = String(row.rdnmadr ?? row["소재지도로명주소"] ?? "").trim();
      const lotAddress = String(row.lnmadr ?? row["소재지지번주소"] ?? "").trim();
      const distanceMeters = haversineDistanceMeters(latitude, longitude, itemLatitude, itemLongitude);

      return {
        id: String(row.prkplceNo ?? row["주차장관리번호"] ?? "").trim(),
        name,
        category: String(row.prkplceSe ?? row["주차장구분"] ?? "").trim() || null,
        type: String(row.prkplceType ?? row["주차장유형"] ?? "").trim() || null,
        address: roadAddress || lotAddress || null,
        roadAddress: roadAddress || null,
        lotAddress: lotAddress || null,
        latitude: itemLatitude,
        longitude: itemLongitude,
        distanceMeters,
        capacity: toNumber(row.prkcmprt ?? row["주차구획수"]),
        grade: String(row.feedingSe ?? row["급지구분"] ?? "").trim() || null,
        alternateDayEnforcement: String(row.enforceSe ?? row["부제시행구분"] ?? "").trim() || null,
        operatingDays: String(row.operDay ?? row["운영요일"] ?? "").trim() || null,
        weekday: {
          open: String(row.weekdayOperOpenHhmm ?? row["평일운영시작시각"] ?? "").trim() || null,
          close: String(row.weekdayOperColseHhmm ?? row["평일운영종료시각"] ?? "").trim() || null,
        },
        saturday: {
          open: String(row.satOperOperOpenHhmm ?? row["토요일운영시작시각"] ?? "").trim() || null,
          close: String(row.satOperCloseHhmm ?? row["토요일운영종료시각"] ?? "").trim() || null,
        },
        holiday: {
          open: String(row.holidayOperOpenHhmm ?? row["공휴일운영시작시각"] ?? "").trim() || null,
          close: String(row.holidayCloseOpenHhmm ?? row["공휴일운영종료시각"] ?? "").trim() || null,
        },
        feeInfo: String(row.parkingchrgeInfo ?? row["요금정보"] ?? "").trim() || null,
        basicTime: toNumber(row.basicTime ?? row["주차기본시간"]),
        basicCharge: toNumber(row.basicCharge ?? row["주차기본요금"]),
        additionalUnitTime: toNumber(row.addUnitTime ?? row["추가단위시간"]),
        additionalUnitCharge: toNumber(row.addUnitCharge ?? row["추가단위요금"]),
        dailyTicketTime: toNumber(row.dayCmmtktAdjTime ?? row["1일주차권요금적용시간"]),
        dailyTicketCharge: toNumber(row.dayCmmtkt ?? row["1일주차권요금"]),
        monthlyTicketCharge: toNumber(row.monthCmmtkt ?? row["월정기권요금"]),
        paymentMethods: String(row.metpay ?? row["결제방법"] ?? "").trim() || null,
        notes: String(row.spcmnt ?? row["특기사항"] ?? "").trim() || null,
        managementAgency: String(row.institutionNm ?? row["관리기관명"] ?? "").trim() || null,
        phone: String(row.phoneNumber ?? row["전화번호"] ?? "").trim() || null,
        hasAccessibleParking: toBooleanYesNo(row.pwdbsPpkZoneYn ?? row["장애인전용주차구역보유여부"]),
        referenceDate: String(row.referenceDate ?? row["데이터기준일자"] ?? "").trim() || null,
        providerCode: String(row.insttCode ?? row.instt_code ?? row["제공기관코드"] ?? "").trim() || null,
        providerName: String(row.insttNm ?? row.instt_nm ?? row["제공기관기관명"] ?? row["제공기관명"] ?? "").trim() || null,
        mapUrl: `https://map.kakao.com/link/map/${encodeURIComponent(name)},${itemLatitude},${itemLongitude}`,
      };
    })
    .filter(Boolean)
    .filter((item) => maxDistanceMeters === null || item.distanceMeters <= maxDistanceMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters || String(left.name).localeCompare(String(right.name), "ko"));

  const deduped = [];
  const seen = new Set();
  for (const item of items) {
    const key = [item.id, item.name, item.address, item.latitude, item.longitude].join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

module.exports = {
  getParkingItems,
  haversineDistanceMeters,
  normalizeParkingLotRows,
  toNumber,
};
