/* ============================================================
   점메추 / 저메추  —  앱 로직
   foods.js 가 먼저 로드되어 전역 FOODS 배열을 제공한다.
   ============================================================ */

/* ------------------------------------------------------------
   1. 상황별 규칙  ★ 여기가 "용도에 따라 후보가 달라지는" 핵심
   같은 음식이라도 상황마다 후보에 오르기도 하고 빠지기도 한다.
   "회식인데 이건 좀 아닌데?" 싶으면 해당 ok() 한 줄만 고치면 된다.
   ------------------------------------------------------------ */
const SCENES = {
  lab_party: {
    label: "연구실 회식",
    emoji: "🍻",
    hint: "여럿이 나눠 먹고 술 곁들이기 좋은 메뉴",
    // 나눠 먹는 음식 + 어느 정도 가격대.
    // → 김밥·라면·혼밥용 덮밥은 여기서 자동으로 빠진다.
    ok: d => d.share && d.price >= 2,
  },
  lab_meal: {
    label: "연구실 식사",
    emoji: "🥢",
    hint: "평일에 동료들이랑 부담 없이, 오후에 냄새 안 남게",
    // 부담 없는 가격 + 냄새 강한 것 제외 (오후에 사람들 만나야 하니까)
    // → 곱창·삼겹살·청국장, 오마카세 같은 고가 메뉴, 먹태 같은 안주가 빠진다.
    ok: d => d.price <= 2 && !d.smell && d.cat !== "술안주",
  },
  date: {
    label: "데이트",
    emoji: "💕",
    hint: "분위기 좋고 냄새 안 나는 곳",
    // 분위기 플래그 필수 + 옷에 냄새 배는 것 제외
    // → 곱창·막창·닭발·순대국밥 계열이 통째로 빠진다.
    ok: d => d.mood && !d.smell,
  },
  solo: {
    label: "혼밥",
    emoji: "🧘",
    hint: "혼자 가서 1인분 시켜도 안 어색한",
    // 1인분 주문이 자연스러운 것만.
    // → 보쌈·전골·삼겹살 같은 2인분 이상 메뉴가 빠진다.
    ok: d => d.solo,
  },
  friends: {
    label: "친구랑 식사",
    emoji: "🙌",
    hint: "편하게 아무거나",
    // 가장 느슨함 — 사실상 전부 허용
    ok: () => true,
  },
};

const SCENE_ORDER = ["lab_party", "lab_meal", "date", "solo", "friends"];

/* 점심/저녁 가중치 보정 (하드 필터가 아니라 확률만 조정) */
function timeWeight(d, meal) {
  let w = 1;
  if (meal === "lunch") {
    if (d.booze) w *= 0.35;   // 점심부터 술안주는 좀
    if (d.heavy) w *= 0.7;
    if (d.light) w *= 1.3;
    if (d.lab)   w *= 1.4;    // 점심엔 빨리 나오는 게 최고
  } else {
    if (d.booze) w *= 1.5;
    if (d.heavy) w *= 1.2;
    if (d.light) w *= 0.85;
  }
  return w;
}

/* ------------------------------------------------------------
   2. 저장소
   ------------------------------------------------------------ */
const KEY = {
  excluded: "mealpicker.excluded",           // 전역: 아예 안 먹는 음식
  sceneExcluded: "mealpicker.sceneExcluded", // 상황별: 이 상황에서만 빼는 음식
  prefs: "mealpicker.prefs",
  recent: "mealpicker.recent",
  syncKey: "mealpicker.syncKey",       // 기기 간 동기화용 비밀 코드
  updatedAt: "mealpicker.updatedAt",   // 제외 목록을 마지막으로 고친 시각
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("저장된 데이터를 읽지 못했습니다:", key, e);
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("저장에 실패했습니다:", key, e);
  }
}

let excluded = new Set(load(KEY.excluded, []));

/* sceneExcluded: { lab_party: Set, lab_meal: Set, ... } */
let sceneExcluded = {};
(function initSceneExcluded() {
  const stored = load(KEY.sceneExcluded, {});
  SCENE_ORDER.forEach(k => {
    sceneExcluded[k] = new Set(Array.isArray(stored[k]) ? stored[k] : []);
  });
})();

let recent = load(KEY.recent, []);
let prefs = Object.assign(
  { scene: "solo", meal: null, maxSpicy: 3, noSea: false, vegOnly: false, withDessert: false },
  load(KEY.prefs, {})
);
if (!SCENES[prefs.scene]) prefs.scene = "solo";
if (prefs.meal !== "lunch" && prefs.meal !== "dinner") {
  prefs.meal = new Date().getHours() < 15 ? "lunch" : "dinner";
}

function persistPrefs() { save(KEY.prefs, prefs); }

/* 제외 목록을 건드리는 모든 경로가 아래 둘 중 하나를 거치므로,
   여기서만 동기화 업로드를 걸어두면 빠지는 곳이 없다. */
function persistExcluded() {
  save(KEY.excluded, [...excluded]);
  touch();
}
function persistSceneExcluded() {
  const plain = {};
  SCENE_ORDER.forEach(k => { plain[k] = [...sceneExcluded[k]]; });
  save(KEY.sceneExcluded, plain);
  touch();
}

/* 로컬을 고친 시각을 남기고 업로드를 예약한다 (동기화 섹션에서 정의) */
function touch() {
  updatedAt = Date.now();
  save(KEY.updatedAt, updatedAt);
  schedulePush();
}

/* ------------------------------------------------------------
   3. 후보 계산
   ------------------------------------------------------------ */
function candidates(sceneKey) {
  const key = sceneKey || prefs.scene;
  const scene = SCENES[key];
  const sceneOut = sceneExcluded[key];
  return FOODS.filter(d => {
    if (excluded.has(d.id)) return false;          // 아예 안 먹는 음식
    if (sceneOut.has(d.id)) return false;          // 이 상황에서만 뺀 음식
    if (d.dessert && !prefs.withDessert) return false;
    if (d.spicy > prefs.maxSpicy) return false;
    if (prefs.noSea && d.sea) return false;
    if (prefs.vegOnly && !d.veg) return false;
    return scene.ok(d);                            // 상황별 자동 규칙
  });
}

/* 가중치 랜덤 + 최근에 나온 것 회피 */
function drawFrom(pool) {
  if (pool.length === 0) return null;

  // 후보가 넉넉할 때만 최근 목록을 피한다
  let usable = pool;
  if (pool.length > recent.length + 3) {
    const filtered = pool.filter(d => !recent.includes(d.id));
    if (filtered.length > 0) usable = filtered;
  }

  const weights = usable.map(d => timeWeight(d, prefs.meal));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < usable.length; i++) {
    r -= weights[i];
    if (r <= 0) return usable[i];
  }
  return usable[usable.length - 1];
}

function rememberPick(food) {
  recent = [food.id, ...recent.filter(id => id !== food.id)].slice(0, 8);
  save(KEY.recent, recent);
}

/* ------------------------------------------------------------
   4. DOM
   ------------------------------------------------------------ */
const $ = sel => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const dom = {
  tabs: $("#tabs"),
  hint: $("#sceneHint"),
  mealBtns: document.querySelectorAll("[data-meal]"),
  stage: $("#stage"),
  rollBtn: $("#rollBtn"),
  actions: $("#actions"),
  again: $("#againBtn"),
  excludeScene: $("#excludeSceneBtn"),
  excludeAll: $("#excludeAllBtn"),
  poolInfo: $("#poolInfo"),
  spicy: $("#spicyRange"),
  spicyLabel: $("#spicyLabel"),
  noSea: $("#noSea"),
  vegOnly: $("#vegOnly"),
  withDessert: $("#withDessert"),
  settingsBtn: $("#settingsBtn"),
  settings: $("#settings"),
  closeSettings: $("#closeSettings"),
  excludedList: $("#excludedList"),
  excludedCount: $("#excludedCount"),
  sceneLists: $("#sceneLists"),
  search: $("#search"),
  searchResults: $("#searchResults"),
  backupText: $("#backupText"),
  exportBtn: $("#exportBtn"),
  importBtn: $("#importBtn"),
  backupMsg: $("#backupMsg"),
  resetBtn: $("#resetBtn"),
  syncBox: $("#syncBox"),
  syncOff: $("#syncOff"),
  syncKeyText: $("#syncKeyText"),
  syncCopyBtn: $("#syncCopyBtn"),
  syncNowBtn: $("#syncNowBtn"),
  syncJoinInput: $("#syncJoinInput"),
  syncJoinBtn: $("#syncJoinBtn"),
  syncMsg: $("#syncMsg"),
};

let current = null;   // 지금 화면에 떠 있는 음식
let rolling = false;

/* ---- 탭 ---- */
function renderTabs() {
  dom.tabs.innerHTML = "";
  SCENE_ORDER.forEach(key => {
    const s = SCENES[key];
    const btn = el("button", "tab" + (prefs.scene === key ? " active" : ""));
    btn.appendChild(el("span", "tab-emoji", s.emoji));
    btn.appendChild(el("span", null, s.label));
    btn.onclick = () => {
      prefs.scene = key;
      persistPrefs();
      renderTabs();
      resetStage();
      updatePoolInfo();
    };
    dom.tabs.appendChild(btn);
  });
  dom.hint.textContent = SCENES[prefs.scene].hint;
  dom.excludeScene.textContent = `${SCENES[prefs.scene].label}엔 빼줘`;
}

function renderMealToggle() {
  dom.mealBtns.forEach(b => b.classList.toggle("active", b.dataset.meal === prefs.meal));
}

/* ---- 결과 카드 ---- */
const PRICE_TEXT = { 1: "₩ 만원 이하", 2: "₩₩ 1~2.5만원", 3: "₩₩₩ 2.5만원 이상" };

function chipsFor(d) {
  const chips = [];
  if (d.spicy === 1) chips.push("🌶️ 약간 매움");
  if (d.spicy === 2) chips.push("🌶️🌶️ 꽤 매움");
  if (d.spicy === 3) chips.push("🌶️🌶️🌶️ 아주 매움");
  if (d.sea) chips.push("🦐 해산물");
  if (d.veg) chips.push("🥗 채식 가능");
  if (d.booze) chips.push("🍺 술 안주");
  if (d.smell) chips.push("💨 냄새 강함");
  if (d.share) chips.push("👥 나눠먹기");
  if (d.solo) chips.push("🧘 혼밥 가능");
  return chips;
}

function showResult(d) {
  current = d;
  dom.stage.innerHTML = "";
  const card = el("div", "card");
  card.appendChild(el("div", "card-cat", d.cat));
  card.appendChild(el("div", "card-name", d.name));
  card.appendChild(el("div", "card-price", PRICE_TEXT[d.price]));
  const chipBox = el("div", "chips");
  chipsFor(d).forEach(c => chipBox.appendChild(el("span", "chip", c)));
  card.appendChild(chipBox);
  dom.stage.appendChild(card);
  dom.rollBtn.classList.add("hidden");
  dom.actions.classList.remove("hidden");
}

function resetStage() {
  current = null;
  dom.stage.innerHTML = "";
  dom.stage.appendChild(el("div", "placeholder", "오늘 뭐 먹지?"));
  dom.rollBtn.classList.remove("hidden");
  dom.actions.classList.add("hidden");
}

function showEmpty(msg) {
  current = null;
  dom.stage.innerHTML = "";
  dom.stage.appendChild(el("div", "empty", msg));
  dom.rollBtn.classList.remove("hidden");
  dom.actions.classList.add("hidden");
}

/* ---- 룰렛 ---- */
function roll() {
  if (rolling) return;
  const pool = candidates();
  if (pool.length === 0) {
    showEmpty("조건에 맞는 음식이 없어요.\n필터를 풀거나 제외 목록을 확인해 보세요.");
    return;
  }
  const winner = drawFrom(pool);

  rolling = true;
  dom.rollBtn.classList.add("hidden");
  dom.actions.classList.add("hidden");
  dom.stage.innerHTML = "";
  const spinner = el("div", "spinner");
  dom.stage.appendChild(spinner);

  const DURATION = 1300;
  const start = performance.now();
  let lastSwap = 0;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(safety);
    rolling = false;
    rememberPick(winner);
    showResult(winner);
  }

  // 탭이 백그라운드로 가면 requestAnimationFrame이 멈춘다.
  // 그대로 두면 rolling 플래그가 안 풀려 버튼이 먹통이 되므로 보험을 건다.
  const safety = setTimeout(finish, DURATION + 700);

  function frame(now) {
    if (done) return;
    const t = Math.min(1, (now - start) / DURATION);
    // ease-out: 처음엔 빠르게 스치고 끝으로 갈수록 느려짐
    const interval = 40 + 260 * Math.pow(t, 3);
    if (now - lastSwap >= interval) {
      spinner.textContent = pool[Math.floor(Math.random() * pool.length)].name;
      lastSwap = now;
    }
    if (t < 1) requestAnimationFrame(frame);
    else finish();
  }
  requestAnimationFrame(frame);
}

/* ---- 후보 수 표시 ---- */
function updatePoolInfo() {
  const n = candidates().length;
  dom.poolInfo.textContent = `${SCENES[prefs.scene].label} 후보 ${n}개`;
  dom.poolInfo.classList.toggle("warn", n > 0 && n < 10);
}

/* ------------------------------------------------------------
   5. 제외 관리
   ------------------------------------------------------------ */
function excludeCurrent(scope) {
  if (!current) return;
  if (scope === "all") {
    excluded.add(current.id);
    persistExcluded();
  } else {
    sceneExcluded[prefs.scene].add(current.id);
    persistSceneExcluded();
  }
  refreshSettings();
  updatePoolInfo();
  roll();
}

function makeRow(name, sub, buttons) {
  const row = el("div", "row");
  const nameBox = el("span", "row-name");
  nameBox.appendChild(el("span", null, name));
  if (sub) nameBox.appendChild(el("span", "row-sub", sub));
  row.appendChild(nameBox);
  const btnBox = el("span", "row-btns");
  buttons.forEach(b => btnBox.appendChild(b));
  row.appendChild(btnBox);
  return row;
}

function miniBtn(text, cls, onClick) {
  const b = el("button", "mini" + (cls ? " " + cls : ""), text);
  b.onclick = onClick;
  return b;
}

const FOOD_BY_ID = new Map(FOODS.map(d => [d.id, d]));

function renderExcluded() {
  dom.excludedCount.textContent = excluded.size;
  dom.excludedList.innerHTML = "";
  if (excluded.size === 0) {
    dom.excludedList.appendChild(el("p", "muted", "아직 없습니다. 결과 화면에서 “아예 안 먹어”를 누르면 여기 쌓입니다."));
    return;
  }
  [...excluded].sort().forEach(id => {
    const d = FOOD_BY_ID.get(id);
    dom.excludedList.appendChild(
      makeRow(d ? d.name : id, d ? d.cat : "목록에 없는 항목", [
        miniBtn("복구", null, () => {
          excluded.delete(id);
          persistExcluded();
          refreshSettings();
          updatePoolInfo();
        }),
      ])
    );
  });
}

function renderSceneLists() {
  dom.sceneLists.innerHTML = "";
  SCENE_ORDER.forEach(key => {
    const s = SCENES[key];
    const set = sceneExcluded[key];
    const block = el("div", "scene-block");
    const head = el("div", "scene-head");
    head.appendChild(el("span", null, `${s.emoji} ${s.label}`));
    head.appendChild(el("span", "muted", `${set.size}개 제외 · 후보 ${candidates(key).length}개`));
    block.appendChild(head);

    if (set.size === 0) {
      block.appendChild(el("p", "muted small", "직접 뺀 음식 없음 (상황 규칙만 적용 중)"));
    } else {
      [...set].sort().forEach(id => {
        const d = FOOD_BY_ID.get(id);
        block.appendChild(
          makeRow(d ? d.name : id, d ? d.cat : "목록에 없는 항목", [
            miniBtn("복구", null, () => {
              set.delete(id);
              persistSceneExcluded();
              refreshSettings();
              updatePoolInfo();
            }),
          ])
        );
      });
    }
    dom.sceneLists.appendChild(block);
  });
}

function renderSearch() {
  const q = dom.search.value.trim();
  dom.searchResults.innerHTML = "";
  if (!q) {
    dom.searchResults.appendChild(el("p", "muted small", "음식 이름이나 카테고리(한식, 일식 …)를 입력하세요."));
    return;
  }
  const hits = FOODS.filter(d => d.name.includes(q) || d.cat.includes(q)).slice(0, 40);
  if (hits.length === 0) {
    dom.searchResults.appendChild(el("p", "muted small", "검색 결과가 없습니다."));
    return;
  }
  hits.forEach(d => {
    const outAll = excluded.has(d.id);
    const outScene = sceneExcluded[prefs.scene].has(d.id);
    const btns = [
      miniBtn(outScene ? "상황 복구" : `${SCENES[prefs.scene].label}만 제외`, outScene ? null : "warn", () => {
        const set = sceneExcluded[prefs.scene];
        if (set.has(d.id)) set.delete(d.id); else set.add(d.id);
        persistSceneExcluded();
        refreshSettings();
        updatePoolInfo();
      }),
      miniBtn(outAll ? "전체 복구" : "아예 제외", outAll ? null : "danger", () => {
        if (excluded.has(d.id)) excluded.delete(d.id); else excluded.add(d.id);
        persistExcluded();
        refreshSettings();
        updatePoolInfo();
      }),
    ];
    dom.searchResults.appendChild(makeRow(d.name, d.cat, btns));
  });
}

function refreshSettings() {
  renderExcluded();
  renderSceneLists();
  renderSearch();
}

/* ------------------------------------------------------------
   6. 백업 / 복원
   ------------------------------------------------------------ */
function currentBackup() {
  const scenes = {};
  SCENE_ORDER.forEach(k => { scenes[k] = [...sceneExcluded[k]]; });
  return { version: 1, all: [...excluded], scenes: scenes };
}

function doExport() {
  dom.backupText.value = JSON.stringify(currentBackup());
  dom.backupText.select();
  dom.backupMsg.textContent = "아래 칸의 내용을 복사해서 안전한 곳에 보관하세요.";
}

function doImport() {
  const raw = dom.backupText.value.trim();
  if (!raw) {
    dom.backupMsg.textContent = "먼저 아래 칸에 백업 내용을 붙여넣어 주세요.";
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    dom.backupMsg.textContent = "형식이 올바르지 않습니다. 내보내기로 만든 내용을 그대로 붙여넣어 주세요.";
    return;
  }

  const isStrArray = v => Array.isArray(v) && v.every(x => typeof x === "string");

  if (isStrArray(parsed)) {
    // 예전 형식(전역 목록만)도 받아준다
    excluded = new Set(parsed);
  } else if (parsed && typeof parsed === "object" && isStrArray(parsed.all)) {
    excluded = new Set(parsed.all);
    const scenes = parsed.scenes && typeof parsed.scenes === "object" ? parsed.scenes : {};
    SCENE_ORDER.forEach(k => {
      sceneExcluded[k] = new Set(isStrArray(scenes[k]) ? scenes[k] : []);
    });
  } else {
    dom.backupMsg.textContent = "형식이 올바르지 않습니다. 내보내기로 만든 내용을 그대로 붙여넣어 주세요.";
    return;
  }

  persistExcluded();
  persistSceneExcluded();
  refreshSettings();
  updatePoolInfo();
  const sceneTotal = SCENE_ORDER.reduce((n, k) => n + sceneExcluded[k].size, 0);
  dom.backupMsg.textContent = `전체 제외 ${excluded.size}개, 상황별 제외 ${sceneTotal}개를 불러왔습니다.`;
}

/* ------------------------------------------------------------
   7. 기기 간 동기화 (Firebase Realtime Database REST)

   config.js 의 SYNC_DB_URL 이 비어 있으면 이 절 전체가 꺼지고
   앱은 기존처럼 기기별 로컬 저장만 쓴다.

   동작 방식
     - 기기마다 "동기화 코드"(32자 난수)를 하나 갖는다.
     - 코드가 같은 기기끼리 같은 목록을 본다. 다른 기기에서는
       그 코드를 입력해서 합류시킨다.
     - 제외/복구할 때마다 updatedAt 을 찍고 통째로 업로드한다.
     - 앱을 열거나 다시 볼 때 내려받아, 서버 쪽이 더 최신이면 덮어쓴다.
   ------------------------------------------------------------ */
const SYNC_BASE = (typeof SYNC_DB_URL === "string" ? SYNC_DB_URL : "").trim().replace(/\/+$/, "");
const SYNC_ON = /^https?:\/\/\S+$/.test(SYNC_BASE);

let syncKey = load(KEY.syncKey, "");
let updatedAt = Number(load(KEY.updatedAt, 0)) || 0;
let pushTimer = null;

function makeSyncKey() {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 32);
}

function ensureSyncKey() {
  if (!syncKey) {
    syncKey = makeSyncKey();
    save(KEY.syncKey, syncKey);
  }
  return syncKey;
}

function syncEndpoint() {
  return `${SYNC_BASE}/sync/${ensureSyncKey()}.json`;
}

const isStrArray = v => Array.isArray(v) && v.every(x => typeof x === "string");

/* 서버에서 받은 문서를 로컬에 반영한다.
   persist* 를 쓰지 않는 이유: 그러면 다시 업로드가 걸려 왕복이 생긴다. */
function applyRemote(doc) {
  if (!doc || typeof doc !== "object" || !isStrArray(doc.all)) return false;
  excluded = new Set(doc.all);
  const scenes = doc.scenes && typeof doc.scenes === "object" ? doc.scenes : {};
  SCENE_ORDER.forEach(k => {
    sceneExcluded[k] = new Set(isStrArray(scenes[k]) ? scenes[k] : []);
  });
  updatedAt = Number(doc.updatedAt) || Date.now();
  save(KEY.excluded, [...excluded]);
  const plain = {};
  SCENE_ORDER.forEach(k => { plain[k] = [...sceneExcluded[k]]; });
  save(KEY.sceneExcluded, plain);
  save(KEY.updatedAt, updatedAt);
  return true;
}

function hasLocalData() {
  return excluded.size > 0 || SCENE_ORDER.some(k => sceneExcluded[k].size > 0);
}

async function syncPull() {
  if (!SYNC_ON) return "off";
  const res = await fetch(syncEndpoint(), { cache: "no-store" });
  if (!res.ok) throw new Error("서버 응답 " + res.status);
  const doc = await res.json();
  if (doc === null) {
    // 서버가 비어 있다. 로컬에 뭔가 있으면 그걸 올려서 기준을 만든다.
    if (hasLocalData()) { await syncPush(); return "pushed"; }
    return "empty";
  }
  if ((Number(doc.updatedAt) || 0) > updatedAt) {
    applyRemote(doc);
    refreshSettings();
    updatePoolInfo();
    return "pulled";
  }
  return "local-newer";
}

async function syncPush() {
  if (!SYNC_ON) return "off";
  const body = Object.assign(currentBackup(), { updatedAt: updatedAt || Date.now() });
  const res = await fetch(syncEndpoint(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("서버 응답 " + res.status);
  return "pushed";
}

function schedulePush() {
  if (!SYNC_ON) return;
  clearTimeout(pushTimer);
  // 연속으로 여러 개 제외할 때 매번 올리지 않도록 잠깐 모은다
  pushTimer = setTimeout(() => {
    setSyncMsg("올리는 중…");
    syncPush()
      .then(() => setSyncMsg("동기화됨 · " + nowText()))
      .catch(e => setSyncMsg("업로드 실패: " + e.message + " (로컬에는 저장됨)"));
  }, 800);
}

function nowText() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function setSyncMsg(text) {
  if (dom.syncMsg) dom.syncMsg.textContent = text;
}

function renderSync() {
  if (!dom.syncBox) return;
  if (!SYNC_ON) {
    dom.syncBox.classList.add("hidden");
    dom.syncOff.classList.remove("hidden");
    return;
  }
  dom.syncBox.classList.remove("hidden");
  dom.syncOff.classList.add("hidden");
  dom.syncKeyText.textContent = ensureSyncKey();
}

function runPull(manual) {
  if (!SYNC_ON) return;
  setSyncMsg("확인 중…");
  syncPull()
    .then(r => {
      if (r === "pulled") setSyncMsg("다른 기기 내용을 받아왔습니다 · " + nowText());
      else if (r === "pushed") setSyncMsg("이 기기 내용을 올렸습니다 · " + nowText());
      else if (r === "empty") setSyncMsg("아직 올린 내용이 없습니다.");
      else setSyncMsg(manual ? "이미 최신입니다 · " + nowText() : "");
    })
    .catch(e => setSyncMsg("연결 실패: " + e.message));
}

/* ------------------------------------------------------------
   8. 이벤트 연결
   ------------------------------------------------------------ */
dom.rollBtn.onclick = roll;
dom.again.onclick = roll;
dom.excludeScene.onclick = () => excludeCurrent("scene");
dom.excludeAll.onclick = () => excludeCurrent("all");

dom.mealBtns.forEach(b => {
  b.onclick = () => {
    prefs.meal = b.dataset.meal;
    persistPrefs();
    renderMealToggle();
  };
});

const SPICY_LABELS = ["안 매운 것만", "🌶️ 까지", "🌶️🌶️ 까지", "🌶️🌶️🌶️ 다 좋아"];
dom.spicy.oninput = () => {
  prefs.maxSpicy = Number(dom.spicy.value);
  dom.spicyLabel.textContent = SPICY_LABELS[prefs.maxSpicy];
  persistPrefs();
  updatePoolInfo();
};
["noSea", "vegOnly", "withDessert"].forEach(key => {
  dom[key].onchange = () => {
    prefs[key] = dom[key].checked;
    persistPrefs();
    updatePoolInfo();
  };
});

dom.settingsBtn.onclick = () => {
  refreshSettings();
  renderSync();
  dom.settings.classList.remove("hidden");
};

dom.syncCopyBtn.onclick = () => {
  const key = ensureSyncKey();
  navigator.clipboard.writeText(key)
    .then(() => setSyncMsg("코드를 복사했습니다. 다른 기기에 붙여넣으세요."))
    .catch(() => {
      // 클립보드 권한이 없으면 직접 고를 수 있게 선택만 해준다
      const r = document.createRange();
      r.selectNodeContents(dom.syncKeyText);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      setSyncMsg("자동 복사가 막혀 있습니다. 선택된 코드를 직접 복사하세요.");
    });
};

dom.syncNowBtn.onclick = () => runPull(true);

dom.syncJoinBtn.onclick = () => {
  const k = dom.syncJoinInput.value.trim();
  if (!k) { setSyncMsg("연결할 코드를 입력해 주세요."); return; }
  if (!/^[0-9a-z]{16,64}$/.test(k)) { setSyncMsg("코드 형식이 올바르지 않습니다."); return; }
  syncKey = k;
  save(KEY.syncKey, syncKey);
  // 합류하는 쪽은 서버 내용을 받아야 하므로 로컬 시각을 0으로 낮춘다
  updatedAt = 0;
  save(KEY.updatedAt, 0);
  dom.syncJoinInput.value = "";
  renderSync();
  runPull(true);
};
dom.closeSettings.onclick = () => dom.settings.classList.add("hidden");
dom.settings.onclick = e => { if (e.target === dom.settings) dom.settings.classList.add("hidden"); };

dom.search.oninput = renderSearch;
dom.exportBtn.onclick = doExport;
dom.importBtn.onclick = doImport;

let resetArmed = false;
let resetTimer = null;
dom.resetBtn.onclick = () => {
  if (!resetArmed) {
    resetArmed = true;
    dom.resetBtn.textContent = "정말 지울까요? 한 번 더 누르세요";
    dom.resetBtn.classList.add("danger");
    resetTimer = setTimeout(() => {
      resetArmed = false;
      dom.resetBtn.textContent = "제외 목록 전체 초기화";
      dom.resetBtn.classList.remove("danger");
    }, 4000);
    return;
  }
  clearTimeout(resetTimer);
  excluded.clear();
  SCENE_ORDER.forEach(k => sceneExcluded[k].clear());
  persistExcluded();
  persistSceneExcluded();
  resetArmed = false;
  dom.resetBtn.textContent = "제외 목록 전체 초기화";
  dom.resetBtn.classList.remove("danger");
  refreshSettings();
  updatePoolInfo();
};

document.addEventListener("keydown", e => {
  if (e.key === "Escape") dom.settings.classList.add("hidden");
  if (e.code === "Space" && dom.settings.classList.contains("hidden") && e.target === document.body) {
    e.preventDefault();
    roll();
  }
});

/* ------------------------------------------------------------
   9. 초기화
   ------------------------------------------------------------ */
dom.spicy.value = prefs.maxSpicy;
dom.spicyLabel.textContent = SPICY_LABELS[prefs.maxSpicy];
dom.noSea.checked = prefs.noSea;
dom.vegOnly.checked = prefs.vegOnly;
dom.withDessert.checked = prefs.withDessert;

renderTabs();
renderMealToggle();
resetStage();
updatePoolInfo();
renderSync();

if (SYNC_ON) {
  runPull(false);
  // 폰에서 앱을 다시 열었을 때 다른 기기의 변경을 반영한다
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) runPull(false);
  });
  window.addEventListener("online", () => runPull(false));
}

console.log(`[점메추] 음식 ${FOODS.length}개 로드됨, 동기화 ${SYNC_ON ? "켜짐" : "꺼짐"}`);
SCENE_ORDER.forEach(k => console.log(`  ${SCENES[k].label}: 후보 ${candidates(k).length}개`));
