"use strict";

// FNV-1a 32-bit hash: 문자열 seed를 mulberry32의 정수 seed로 바꾼다.
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// mulberry32: 결정적 PRNG. [0, 1) 범위의 float를 돌려준다.
function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// seed는 정수(그대로 사용) 또는 임의 값(문자열화 후 FNV-1a 해시).
function createSeededRng(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return mulberry32(seed);
  }
  return mulberry32(fnv1a(String(seed ?? "")));
}

// 입력 배열을 바꾸지 않는 seeded Fisher-Yates 셔플.
function seededShuffle(list, rng) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

module.exports = {
  createSeededRng,
  fnv1a,
  seededShuffle,
};
