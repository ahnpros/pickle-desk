/* 어제 기사와 오늘 기사, 달라진 문장만 — 문장 대조 프로토타입
   의존성 없음. 대조는 이 브라우저에서 실제로 계산한다.
   기사·인물·기관은 화면 시연을 위해 쓴 예시(창작)이며 실제 보도가 아니다. */
(function () {
  "use strict";

  var MATCH_MIN = 0.5;  // 이 아래는 '다른 문장'
  var SAME_MIN = 0.94;  // 이 위는 '그대로'

  var ARTICLES = [
    {
      id: "day1",
      stamp: "11/20 (금) 09:12",
      outlet: "속보",
      title: "가람동 물류창고에 불… 3시간 만에 진화",
      sents: [
        { t: "가람동 물류창고에서 오늘 아침 불이 나 3시간 만에 꺼졌다.", src: "소방" },
        { t: "소방 당국은 인명 피해가 없다고 밝혔다.", src: "소방" },
        { t: "불은 창고 2층에서 시작된 것으로 추정된다.", src: "소방" },
        { t: "창고 측은 전기 설비 문제일 수 있다고 말했다.", src: "창고 측" },
        { t: "주변 도로는 한때 통제됐다가 풀렸다.", src: "경찰" }
      ]
    },
    {
      id: "day2",
      stamp: "11/21 (토) 08:40",
      outlet: "종합",
      title: "가람동 창고 화재… 연기 마신 2명 병원 이송",
      sents: [
        { t: "가람동 물류창고 화재로 연기를 마신 2명이 병원으로 옮겨졌다.", src: "소방" },
        { t: "소방 당국은 불이 3시간 만에 꺼졌다고 밝혔다.", src: "소방" },
        { t: "불은 창고 2층에서 시작된 것으로 추정된다.", src: "소방" },
        { t: "경찰은 창고 관계자 3명을 상대로 조사를 시작했다.", src: "경찰" },
        { t: "창고 측은 전기 설비 문제일 수 있다고 말했다.", src: "창고 측" },
        { t: "주변 도로는 한때 통제됐다가 풀렸다.", src: "경찰" }
      ]
    },
    {
      id: "day3",
      stamp: "11/22 (일) 07:55",
      outlet: "종합",
      title: "가람동 창고 화재… 연기 마신 5명 치료 중",
      sents: [
        { t: "가람동 물류창고 화재로 연기를 마신 5명이 병원 치료를 받고 있다.", src: "소방" },
        { t: "이 가운데 1명은 중환자실에 있다.", src: "병원" },
        { t: "소방 당국은 불이 3시간 만에 꺼졌다고 밝혔다.", src: "소방" },
        { t: "경찰은 창고 관계자 3명을 상대로 조사를 이어가고 있다.", src: "경찰" },
        { t: "경찰은 발화 지점을 2층 창고 안쪽으로 좁혔다.", src: "경찰" },
        { t: "불은 창고 2층에서 시작된 것으로 추정된다.", src: "소방" },
        { t: "앞서 인명 피해가 없다고 밝혔던 소방 당국의 1차 발표는 정정됐다.", src: "정정" },
        { t: "주변 도로는 한때 통제됐다가 어제 저녁에 풀렸다.", src: "경찰" },
        { t: "화재 원인은 아직 확정되지 않았다.", src: "소방" }
      ]
    }
  ];

  var READ_KEY = "np-news-read-v1";

  var S = {
    base: "day2",
    compare: "day3",
    showSame: true,
    diff: null
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function art(id) {
    for (var i = 0; i < ARTICLES.length; i++) if (ARTICLES[i].id === id) return ARTICLES[i];
    return ARTICLES[0];
  }
  function announce(text) {
    var live = $("live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = text; }, 60);
  }

  /* ---------- 문장 비교 ---------- */
  function norm(s) {
    return String(s).replace(/[\s.,!?'"“”‘’()《》<>·…:;~\-—]/g, "");
  }
  function bigrams(s) {
    var n = norm(s);
    var set = Object.create(null);
    for (var i = 0; i < n.length - 1; i++) set[n.substr(i, 2)] = 1;
    if (n.length === 1) set[n] = 1;
    return Object.keys(set);
  }
  function dice(a, b) {
    var A = bigrams(a), B = bigrams(b);
    if (!A.length || !B.length) return 0;
    var map = Object.create(null), i, hit = 0;
    for (i = 0; i < A.length; i++) map[A[i]] = (map[A[i]] || 0) + 1;
    for (i = 0; i < B.length; i++) {
      if (map[B[i]]) { hit += 1; map[B[i]] -= 1; }
    }
    return (2 * hit) / (A.length + B.length);
  }

  var NUM_RE = /(\d+(?:\.\d+)?)\s*(명|시간|분|개|곳|차례|%|층|원|년|월|일|대)/g;
  function numbers(s) {
    var out = [], m;
    NUM_RE.lastIndex = 0;
    while ((m = NUM_RE.exec(String(s))) !== null) {
      out.push({ v: m[1], u: m[2], raw: m[0] });
    }
    return out;
  }

  function align(baseSents, newSents) {
    var pairs = [], all = [], i, j;
    for (i = 0; i < baseSents.length; i++) {
      for (j = 0; j < newSents.length; j++) {
        var sim = dice(baseSents[i].t, newSents[j].t);
        if (sim >= MATCH_MIN) pairs.push({ i: i, j: j, sim: sim });
        if (sim >= 0.3) all.push({ i: i, j: j, sim: sim });
      }
    }
    var all = [];
    pairs.sort(function (a, b) { return b.sim - a.sim; });
    var usedBase = {}, usedNew = {}, match = {};
    for (var k = 0; k < pairs.length; k++) {
      var p = pairs[k];
      if (usedBase[p.i] || usedNew[p.j]) continue;
      usedBase[p.i] = 1; usedNew[p.j] = 1;
      match[p.j] = { i: p.i, sim: p.sim };
    }
    return { match: match, usedBase: usedBase, all: all };
  }

  /* 기사가 스스로 밝힌 정정 표시만 잡는다. 문장 차이로 정정을 추정하지 않는다. */
  function isCorrection(text) {
    return /정정|바로잡|철회|앞서 보도|앞서 밝혔/.test(String(text));
  }

  function numChanges(baseText, newText) {
    var b = numbers(baseText), n = numbers(newText);
    var byUnitB = {}, byUnitN = {}, i, out = [];
    for (i = 0; i < b.length; i++) (byUnitB[b[i].u] = byUnitB[b[i].u] || []).push(b[i].v);
    for (i = 0; i < n.length; i++) (byUnitN[n[i].u] = byUnitN[n[i].u] || []).push(n[i].v);
    Object.keys(byUnitN).forEach(function (unit) {
      var nv = byUnitN[unit].join(",");
      var bv = (byUnitB[unit] || []).join(",");
      if (bv !== nv) out.push({ unit: unit, before: bv || "없음", after: nv, raw: n[0].raw });
    });
    return out;
  }

  function markNumbers(text, baseText) {
    var baseVals = numbers(baseText).map(function (x) { return x.v + x.u; });
    return esc(text).replace(/(\d+(?:\.\d+)?)\s*(명|시간|분|개|곳|차례|%|층|원|년|월|일|대)/g, function (whole, v, u) {
      var key = v + u;
      if (baseVals.indexOf(key) === -1) {
        return "<mark>" + esc(whole) + "</mark>";
      }
      return esc(whole);
    });
  }

  function buildDiff(baseId, newId) {
    var base = art(baseId), neu = art(newId);
    var al = align(base.sents, neu.sents);
    var items = [], numRows = [], added = 0, changed = 0, same = 0, fixed = 0;

    for (var j = 0; j < neu.sents.length; j++) {
      var ns = neu.sents[j];
      var m = al.match[j];
      if (m) {
        var bs = base.sents[m.i];
        var isSame = m.sim >= SAME_MIN;
        if (isSame) {
          same += 1;
          items.push({ kind: "same", text: ns.t, src: ns.src, sim: m.sim });
        } else {
          changed += 1;
          var nc = numChanges(bs.t, ns.t);
          for (var q = 0; q < nc.length; q++) {
            numRows.push({ unit: nc[q].unit, before: nc[q].before, after: nc[q].after, text: ns.t });
          }
          items.push({ kind: "chg", text: ns.t, old: bs.t, src: ns.src, sim: m.sim, nums: nc });
        }
      } else if (isCorrection(ns.t)) {
        fixed += 1;
        items.push({ kind: "fix", text: ns.t, src: ns.src, sim: 0 });
      } else {
        added += 1;
        items.push({ kind: "add", text: ns.t, src: ns.src, sim: 0 });
      }
    }
    var removed = 0;
    for (var i = 0; i < base.sents.length; i++) {
      if (!al.usedBase[i]) {
        removed += 1;
        items.push({ kind: "rem", text: base.sents[i].t, src: base.sents[i].src, sim: 0 });
      }
    }

    /* 임계값 경계(0.35~0.72)에 걸린 짝을 그대로 보여 준다. */
    var edge = [];
    for (var e = 0; e < al.all.length; e++) {
      var p = al.all[e];
      if (p.sim >= 0.35 && p.sim <= 0.72) {
        edge.push({ baseText: base.sents[p.i].t, newText: neu.sents[p.j].t, sim: p.sim, matched: !!(al.match[p.j] && al.match[p.j].i === p.i) });
      }
    }
    edge.sort(function (a, b) { return b.sim - a.sim; });

    numRows.sort(function (a, b) { return a.unit < b.unit ? -1 : 1; });
    return {
      base: base, neu: neu, items: items, nums: numRows, edge: edge.slice(0, 6),
      added: added, changed: changed, same: same, removed: removed, fixed: fixed,
      numCount: numRows.length
    };
  }

  /* ---------- 렌더 ---------- */
  function badge(kind) {
    return kind === "add" ? "새로 밝혀짐" : kind === "chg" ? "바뀜" : kind === "rem" ? "빠짐" : kind === "fix" ? "정정 표시" : "그대로";
  }

  function render() {
    var d = S.diff;
    $("cAdd").textContent = d.added;
    $("cChg").textContent = d.changed;
    $("cRem").textContent = d.removed;
    $("cFix").textContent = d.fixed;
    $("cSame").textContent = d.same;
    $("cNum").textContent = d.numCount;

    $("diffSub").textContent = d.base.stamp + " 「" + d.base.title + "」 → " + d.neu.stamp +
      " 「" + d.neu.title + "」 · 문장 " + d.base.sents.length + "개와 " + d.neu.sents.length + "개를 대조했습니다.";

    var list = $("diffList");
    var html = "";
    var shown = 0;
    for (var i = 0; i < d.items.length; i++) {
      var it = d.items[i];
      if (!S.showSame && it.kind === "same") continue;
      shown += 1;
      html += '<li class="' + it.kind + '"><span class="badge">' + badge(it.kind) + "</span>";
      if (it.kind === "chg") {
        html += "<p>" + markNumbers(it.text, it.old) + "</p>";
        html += '<p class="old">이전: <s>' + esc(it.old) + "</s></p>";
      } else if (it.kind === "rem") {
        html += "<p><s>" + esc(it.text) + "</s></p><p class=\"old\">이 기사에는 없습니다. 정정된 것인지 단순히 빠진 것인지 이 화면은 판단하지 않습니다.</p>";
      } else {
        html += "<p>" + esc(it.text) + "</p>";
      }
      html += '<div class="meta">출처 표기: ' + esc(it.src) +
        (it.kind === "same" ? " · 유사도 " + it.sim.toFixed(2) : it.kind === "chg" ? " · 유사도 " + it.sim.toFixed(2) : "") +
        "</div></li>";
    }
    list.innerHTML = html;

    var nb = $("numBody");
    if (d.nums.length) {
      var rows = "";
      for (var r = 0; r < d.nums.length; r++) {
        rows += "<tr><td>" + esc(d.nums[r].unit) + "</td><td><b>" + esc(d.nums[r].before) +
          "</b></td><td><b>" + esc(d.nums[r].after) + "</b></td><td class=\"small\">" + esc(d.nums[r].text) + "</td></tr>";
      }
      nb.innerHTML = rows;
    } else {
      nb.innerHTML = '<tr><td colspan="4" class="muted small">숫자가 바뀐 문장이 없습니다.</td></tr>';
    }

    var eb = $("edgeBody");
    if (d.edge.length) {
      var erows = "";
      for (var x = 0; x < d.edge.length; x++) {
        var e = d.edge[x];
        erows += "<tr><td class=\"small\">" + esc(e.baseText) + "</td><td class=\"small\">" + esc(e.newText) +
          "</td><td><b>" + e.sim.toFixed(2) + "</b></td><td class=\"small\">" +
          (e.matched ? "짝지어짐" : "짝 안 지어짐(따로 셈)") + "</td></tr>";
      }
      eb.innerHTML = erows;
    } else {
      eb.innerHTML = '<tr><td colspan="4" class="muted small">경계에 걸린 짝이 없습니다.</td></tr>';
    }

    $("btnAll").textContent = S.showSame ? "그대로인 문장 숨기기" : "그대로인 문장 보기";
    $("btnAll").setAttribute("aria-pressed", S.showSame ? "true" : "false");
    $("btnAll").className = S.showSame ? "btn on" : "btn";

    announce("새로 밝혀진 문장 " + d.added + "개, 바뀐 문장 " + d.changed + "개, 빠진 문장 " + d.removed +
      "개, 정정 표시 " + d.fixed + "개, 숫자 변화 " + d.numCount + "곳입니다. 화면에 " + shown + "줄을 보여 주고, 경계 사례 " + d.edge.length + "건을 따로 적었습니다.");

    renderReadMark();
  }

  function pairKey() { return S.base + ">" + S.compare; }

  function readState() {
    try {
      var raw = localStorage.getItem(READ_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function renderReadMark() {
    var st = readState();
    var box = $("readMark");
    if (st && st.key === pairKey()) {
      box.hidden = false;
      box.innerHTML = "지난번에 이 비교를 <b>" + st.count + "줄</b>까지 읽었습니다(" + esc(st.at) + "). " +
        "<button type=\"button\" class=\"btn\" id=\"btnResumeRead\" style=\"margin-left:6px\">그 자리부터 보기</button>";
      var btn = $("btnResumeRead");
      if (btn) {
        btn.addEventListener("click", function () {
          var li = $("diffList").children[Math.min(st.count, $("diffList").children.length - 1)];
          if (li) {
            li.scrollIntoView({ block: "center" });
            li.setAttribute("tabindex", "-1");
            li.focus();
            announce("지난번에 멈춘 줄로 이동했습니다.");
          }
        });
      }
    } else {
      box.hidden = true;
    }
  }

  /* ---------- wiring ---------- */
  function fillSelects() {
    var b = $("selBase"), n = $("selNew");
    var html = "";
    for (var i = 0; i < ARTICLES.length; i++) {
      html += '<option value="' + ARTICLES[i].id + '">' + ARTICLES[i].stamp + " · " + esc(ARTICLES[i].outlet) + "</option>";
    }
    b.innerHTML = html; n.innerHTML = html;
    b.value = S.base; n.value = S.compare;
  }

  function recompute() {
    S.diff = buildDiff(S.base, S.compare);
    render();
  }

  function init() {
    fillSelects();
    S.diff = buildDiff(S.base, S.compare);
    render();

    $("selBase").addEventListener("change", function () {
      if (this.value === S.compare) {
        var other = ARTICLES.filter(function (a) { return a.id !== this.value; }.bind(this))[0];
        if (other) { S.compare = other.id; $("selNew").value = other.id; }
      }
      S.base = this.value;
      recompute();
      $("diffHeading").focus();
    });

    $("selNew").addEventListener("change", function () {
      if (this.value === S.base) {
        var other = ARTICLES.filter(function (a) { return a.id !== this.value; }.bind(this))[0];
        if (other) { S.base = other.id; $("selBase").value = other.id; }
      }
      S.compare = this.value;
      recompute();
      $("diffHeading").focus();
    });

    $("btnAll").addEventListener("click", function () {
      S.showSame = !S.showSame;
      render();
    });

    $("btnReadAll").addEventListener("click", function () {
      var count = $("diffList").children.length;
      var at = new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      try {
        localStorage.setItem(READ_KEY, JSON.stringify({ key: pairKey(), count: count, at: at }));
      } catch (e) { /* 저장 못 해도 화면은 계속 */ }
      $("readSaved").textContent = "저장했습니다. 다음에 같은 사건을 열면 이 자리를 알려 줍니다.";
      renderReadMark();
      announce("이 자리를 기억했습니다. 다음에 " + art(S.compare).stamp + " 기사를 다시 비교하면 이어서 볼 수 있습니다.");
    });

    /* 탭 */
    var tabs = document.querySelectorAll('nav.tabs [role="tab"]');
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener("click", function () {
        Array.prototype.forEach.call(tabs, function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
      });
      tab.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
        ev.preventDefault();
        var list = Array.prototype.slice.call(tabs);
        var i = list.indexOf(tab);
        var next = list[(i + (ev.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
        next.focus();
        next.click();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
