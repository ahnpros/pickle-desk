/* 공개 범위 장부 — 쓰기·올리기·고치기를 잇는 프로토타입
   의존성 없음. 상태는 이 브라우저에만 남는다. */
(function () {
  "use strict";

  var NEIGHBORS = 12;

  var POLICY = {
    neighbor: {
      label: "이웃 공개",
      audience: "이웃 " + NEIGHBORS + "명",
      band: "이웃 " + NEIGHBORS + "명에게 공개 — 이웃을 맺은 사람만 볼 수 있어요. 검색에는 안 나와요.",
      bandEdit: "이웃 " + NEIGHBORS + "명에게 공개 중 — 수정해도 이 범위가 유지돼요.",
      button: "이웃 " + NEIGHBORS + "명에게 게시",
      search: "검색에는 나오지 않습니다.",
      tone: "",
      short: "이웃 " + NEIGHBORS + "명"
    },
    public: {
      label: "전체 공개",
      audience: "판 방문자 누구나",
      band: "전체 공개 — 판 방문자 누구나 볼 수 있고, 검색에도 잡혀요(반영 최대 10분).",
      bandEdit: "전체 공개 중 — 판 방문자 누구나 볼 수 있고, 검색에도 잡혀요.",
      button: "전체 공개로 게시",
      search: "검색에 잡힙니다. 반영까지 최대 10분 걸릴 수 있어요.",
      tone: "wide",
      short: "누구나"
    },
    private: {
      label: "나만 보기",
      audience: "아무도 없음",
      band: "나만 보기 — 올린 뒤에도 내 화면에만 남아요.",
      bandEdit: "나만 보기 — 이 글은 아무에게도 보이지 않아요.",
      button: "나만 보기로 저장",
      search: "검색에도, 이웃 피드에도 나오지 않습니다.",
      tone: "narrow",
      short: "나만"
    }
  };

  var DRAFT_KEY = "np-scope-ledger-draft-v1";

  var S = {
    screen: "compose",
    scope: "neighbor",
    rev: 1,
    publishedScope: null,
    seen: 0,
    log: [],
    editScope: null,
    title: "주말에 다녀온 길",
    body: "어제는 오랜만에 집 근처 산책로를 걸었다. 사람이 적어서 조용했고, 나무 색이 벌써 달라져 있었다.",
    pendingScope: null
  };

  function $(id) { return document.getElementById(id); }
  function tNow() {
    try {
      return new Date().toLocaleTimeString("ko-KR", { hour12: false });
    } catch (e) {
      return "--:--:--";
    }
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function announce(text) {
    var box = $("announced");
    if (box) box.textContent = text;
    var live = $("liveRegion");
    if (live) {
      live.textContent = "";
      window.setTimeout(function () { live.textContent = text; }, 60);
    }
  }

  /* ---------- band / button ---------- */
  function renderBand() {
    /* 쓰기 화면은 지금 고른 값, 올림·수정 화면은 실제 적용 중인 값을 띠에 적는다.
       수정 화면의 폼 값은 아래 상자에 따로 적어, 띠는 ‘지금 무엇이 적용 중인지’만 말한다. */
    var key = S.screen === "compose" ? S.scope : (S.publishedScope || S.scope);
    var p = POLICY[key];
    var band = $("band");
    band.className = "band " + p.tone;
    $("bandText").textContent = S.screen === "edit" ? p.bandEdit : p.band;
  }

  function renderPrimary() {
    var btn = $("primary");
    if (S.screen === "compose") {
      btn.textContent = POLICY[S.scope].button;
      btn.className = "btn primary" + (S.scope === "public" ? " wide" : "");
      btn.disabled = false;
    } else if (S.screen === "published") {
      btn.textContent = "이 글 고치기";
      btn.className = "btn primary";
      btn.disabled = false;
    } else {
      btn.textContent = "저장";
      btn.className = "btn primary";
      btn.disabled = false;
    }
  }

  function syncScopeButtons(container, value) {
    if (!container) return;
    var items = container.querySelectorAll("[data-scope]");
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute("aria-checked", items[i].getAttribute("data-scope") === value ? "true" : "false");
    }
  }

  function selectScope(value) {
    if (!POLICY[value]) return;
    S.scope = value;
    syncScopeButtons(document.querySelector("#scr-compose .scopes"), value);
    renderBand();
    renderPrimary();
    announce(POLICY[value].band + " 게시 버튼: " + POLICY[value].button);
    saveDraft();
  }

  /* ---------- screens ---------- */
  function show(screen) {
    S.screen = screen;
    $("scr-compose").hidden = screen !== "compose";
    $("scr-published").hidden = screen !== "published";
    $("scr-edit").hidden = screen !== "edit";
    $("headTitle").textContent = screen === "compose" ? "판에 글쓰기" : screen === "published" ? "내 글" : "글 수정";
    var heading = screen === "compose" ? $("h-compose") : screen === "published" ? $("h-pub") : $("h-edit");
    if (heading && heading.focus) heading.focus();
    renderBand();
    renderPrimary();
  }

  /* ---------- draft ---------- */
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title: $("fTitle").value,
        body: $("fBody").value,
        scope: S.scope,
        at: Date.now()
      }));
    } catch (e) { /* 저장 못 해도 화면은 계속 */ }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || typeof d.title !== "string") return null;
      return d;
    } catch (e) { return null; }
  }

  /* ---------- ledger ---------- */
  function addLog(where, fromScope, toScope) {
    S.rev += 1;
    var row = {
      rev: S.rev,
      at: tNow(),
      from: fromScope,
      to: toScope,
      where: where,
      seen: S.seen
    };
    S.log.push(row);
    renderLedger();
    return row;
  }

  function renderLedger() {
    var body = $("ledgerBody");
    var rows = '<tr><td class="n">1</td><td class="n">—</td><td>이웃 공개 (초기값)</td><td>쓰기 화면</td><td class="n">0명</td></tr>';
    for (var i = 0; i < S.log.length; i++) {
      var r = S.log[i];
      rows += '<tr><td class="n">' + r.rev + "</td><td class=\"n\">" + r.at + "</td><td>" +
        (r.from
          ? "<span class=\"strike\">" + esc(POLICY[r.from].label) + "</span> <span class=\"arrow\">→</span> <b>" + esc(POLICY[r.to].label) + "</b>"
          : "<b>" + esc(POLICY[r.to].label) + "</b> <span class=\"tiny muted\">(게시된 범위)</span>") +
        "</td><td>" + esc(r.where) +
        "</td><td class=\"n\">" + r.seen + "명</td></tr>";
    }
    body.innerHTML = rows;
    $("revCount").textContent = (S.log.length + 1) + "개 기록";
    $("revMini").textContent = "scope_rev " + S.rev;
    $("ledgerNote").textContent = S.log.length
      ? "변경 " + S.log.length + "건이 남았습니다. 마지막 변경 시각 " + S.log[S.log.length - 1].at + "."
      : "아직 게시 전입니다. 게시하면 적용된 값과 시각이 첫 기록으로 남습니다.";
  }

  /* ---------- publish ---------- */
  function publish() {
    var title = $("fTitle").value.trim();
    var bodyText = $("fBody").value.trim();
    if (!title) title = "(제목 없음)";
    if (!bodyText) bodyText = "(본문 없음)";

    var chosen = S.scope;
    S.publishedScope = chosen;
    S.seen = 0;

    $("chosenVal").textContent = POLICY[chosen].label;
    $("appliedVal").textContent = POLICY[chosen].label;
    $("audienceVal").textContent = POLICY[chosen].audience;
    $("searchNote").textContent = POLICY[chosen].search;
    $("seenCount").textContent = "0명";
    $("seenWhen").textContent = "아직 아무도 열지 않았어요.";
    $("btnApplyScope").disabled = true;
    $("undoNote").hidden = true;
    $("notifyChk").checked = false;
    syncScopeButtons($("scopeChange"), chosen);
    S.pendingScope = null;

    addLog("게시", null, chosen);
    show("published");
    announce(POLICY[chosen].label + "로 올렸습니다. 지금 " + POLICY[chosen].audience + "이 볼 수 있습니다.");
  }

  /* ---------- post-publish: views ---------- */
  function simulateView() {
    if (S.publishedScope === "private") {
      announce("나만 보기 상태라 아무도 볼 수 없습니다. 공개 범위를 바꾸면 그때부터 보입니다.");
      return;
    }
    S.seen += 1;
    $("seenCount").textContent = S.seen + "명";
    $("seenWhen").textContent = "마지막으로 본 시각 " + tNow() + " (시뮬레이션)";
    refreshUndo();
    announce(S.seen + "명이 봤습니다. 이 상태에서 범위를 좁히면 이미 본 " + S.seen + "명에게는 글이 남습니다.");
  }

  function undoneItems(fromScope, toScope) {
    var items = [];
    var rank = { private: 0, neighbor: 1, public: 2 };
    var narrowing = rank[toScope] < rank[fromScope];
    if (S.seen > 0) {
      items.push("이미 본 <b>" + S.seen + "명</b>의 화면·알림은 그대로 남습니다. 그 사람이 다시 열 수는 없지만, 이미 읽은 내용은 되돌아오지 않습니다.");
      items.push("그중 <b>" + Math.max(1, Math.ceil(S.seen / 3)) + "명</b>이 스크랩하거나 공유 링크를 복사했다고 가정하면, 그 링크는 새 범위의 적용을 받지 않습니다. (예시 값)");
    }
    if (fromScope === "public" || (narrowing && fromScope === "public")) {
      items.push("검색 결과·캐시는 <b>최대 10분</b> 뒤에 바뀝니다. 그 사이에는 검색으로 계속 열릴 수 있습니다.");
    }
    if (!narrowing) {
      items = ["넓히면 <b>새로 " + (NEIGHBORS) + "명 이상</b>이 볼 수 있습니다. 넓힌 뒤에 다시 좁혀도, 이미 본 사람에게서는 회수되지 않습니다."];
    }
    return items;
  }

  function refreshUndo() {
    if (!S.publishedScope) return;
    var target = S.pendingScope;
    var box = $("undoNote");
    if (!target || target === S.publishedScope) {
      box.hidden = true;
      return;
    }
    var rank = { private: 0, neighbor: 1, public: 2 };
    var narrowing = rank[target] < rank[S.publishedScope];
    $("undoTitle").textContent = narrowing
      ? "좁혀도 되돌아오지 않는 것이 있습니다"
      : "넓히면 되돌리기 어려운 것이 생깁니다";
    var items = undoneItems(S.publishedScope, target);
    var html = "";
    for (var i = 0; i < items.length; i++) html += "<li>" + items[i] + "</li>";
    $("undoList").innerHTML = html;
    $("notifyChk").parentNode.hidden = !(S.seen > 0);
    box.hidden = false;
  }

  function chooseNewScope(value) {
    if (!POLICY[value]) return;
    S.pendingScope = value;
    syncScopeButtons($("scopeChange"), value);
    $("btnApplyScope").disabled = value === S.publishedScope;
    refreshUndo();
    if (value !== S.publishedScope) {
      announce("바꾸려는 범위는 " + POLICY[value].label + "입니다. 지금까지 " + S.seen + "명이 봤습니다. 적용하려면 ‘이 범위로 바꾸기’를 누르세요.");
    }
  }

  function applyScope() {
    if (!S.pendingScope || S.pendingScope === S.publishedScope) return;
    var from = S.publishedScope;
    var to = S.pendingScope;
    var notify = $("notifyChk").checked && S.seen > 0;

    S.publishedScope = to;
    $("appliedVal").textContent = POLICY[to].label;
    $("audienceVal").textContent = POLICY[to].audience;
    $("searchNote").textContent = POLICY[to].search;
    $("btnApplyScope").disabled = true;
    $("undoNote").hidden = true;
    syncScopeButtons($("scopeChange"), to);

    addLog("올린 뒤 변경", from, to);
    renderBand();
    announce("공개 범위가 " + POLICY[from].label + "에서 " + POLICY[to].label + "로 바뀌었습니다." +
      (S.seen > 0 ? " 이미 본 " + S.seen + "명에게는 글이 남습니다." : "") +
      (notify ? " 이웃 " + S.seen + "명에게 변경을 알렸습니다." : ""));
    S.pendingScope = to;
  }

  /* ---------- edit ---------- */
  function openEdit() {
    $("eTitle").value = $("fTitle").value;
    $("eBody").value = $("fBody").value;
    S.editScope = S.publishedScope;
    $("editCurrent").textContent = POLICY[S.publishedScope].label + " · " + POLICY[S.publishedScope].audience;
    $("editFormScope").textContent = POLICY[S.editScope].label;
    $("driftBox").hidden = true;
    show("edit");
    renderBand();
    announce("수정 화면입니다. 지금 적용 중인 범위는 " + POLICY[S.publishedScope].label + "이고, 이 화면도 같은 범위로 열렸습니다. 본문만 고치면 범위는 그대로입니다.");
  }

  /* 이 화면을 연 뒤 다른 기기에서 범위가 바뀐 상황 */
  function simulateRemote() {
    var order = ["neighbor", "public", "private"];
    var next = order[(order.indexOf(S.publishedScope) + 1) % 3];
    S.publishedScope = next;
    $("editCurrent").textContent = POLICY[next].label + " · " + POLICY[next].audience;
    $("appliedVal").textContent = POLICY[next].label;
    $("audienceVal").textContent = POLICY[next].audience;
    $("searchNote").textContent = POLICY[next].search;
    syncScopeButtons($("scopeChange"), next);
    renderBand();
    announce("다른 기기에서 공개 범위가 " + POLICY[next].label + "로 바뀌었습니다. 이 화면의 값은 " + POLICY[S.editScope].label + "입니다. 이대로 저장하면 덮어씁니다.");
  }

  function saveEdit(mode) {
    var title = $("eTitle").value.trim();
    var bodyText = $("eBody").value.trim();
    if (!title) title = "(제목 없음)";
    if (!bodyText) bodyText = "(본문 없음)";

    var server = S.publishedScope;
    var mine = S.editScope || server;

    if (server !== mine && !mode) {
      $("driftText").innerHTML = "이 화면을 연 뒤 다른 기기에서 공개 범위가 <b>" + esc(POLICY[server].label) +
        "</b>로 바뀌었습니다. 이 화면의 값은 <b>" + esc(POLICY[mine].label) + "</b>입니다. 이대로 저장하면 다른 기기에서 고른 범위를 덮어씁니다.";
      $("driftBox").hidden = false;
      $("btnKeepScope").focus();
      announce("저장하면 다른 기기에서 바꾼 공개 범위를 덮어씁니다. 서버 값을 유지할지, 이 화면 값으로 덮어쓸지 고르세요.");
      return;
    }

    $("fTitle").value = title;
    $("fBody").value = bodyText;
    $("driftBox").hidden = true;

    var target = mode === "overwrite" ? mine : server;
    var changed = target !== server;
    S.publishedScope = target;
    $("appliedVal").textContent = POLICY[target].label;
    $("audienceVal").textContent = POLICY[target].audience;
    $("searchNote").textContent = POLICY[target].search;
    syncScopeButtons($("scopeChange"), target);
    addLog("수정 저장", changed ? server : null, target);
    show("published");
    announce(changed
      ? "수정을 저장했습니다. 다른 기기의 " + POLICY[server].label + "를 이 화면 값 " + POLICY[target].label + "로 덮어썼습니다."
      : "수정을 저장했습니다. 공개 범위는 " + POLICY[target].label + " 그대로입니다.");
  }

  /* ---------- wiring ---------- */
  function init() {
    /* 쓰기 화면 범위 선택 */
    var composeScopes = document.querySelector("#scr-compose .scopes");
    composeScopes.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-scope]");
      if (btn) selectScope(btn.getAttribute("data-scope"));
    });
    composeScopes.addEventListener("keydown", function (ev) {
      var keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
      if (keys.indexOf(ev.key) === -1) return;
      ev.preventDefault();
      var order = ["neighbor", "public", "private"];
      var idx = order.indexOf(S.scope);
      var next = (ev.key === "ArrowDown" || ev.key === "ArrowRight") ? (idx + 1) % 3 : (idx + 2) % 3;
      selectScope(order[next]);
      var target = composeScopes.querySelector('[data-scope="' + order[next] + '"]');
      if (target) target.focus();
    });

    $("fTitle").addEventListener("input", saveDraft);
    $("fBody").addEventListener("input", saveDraft);

    $("btnBack").addEventListener("click", function () {
      saveDraft();
      $("backResult").hidden = false;
      $("backScope").textContent = POLICY[S.scope].label;
      announce("초안을 저장하고 나왔습니다. 제목·본문·공개 범위(" + POLICY[S.scope].label + ")를 보관했습니다.");
    });

    $("btnResume").addEventListener("click", function () {
      var d = loadDraft();
      if (d) {
        $("fTitle").value = d.title;
        $("fBody").value = d.body;
        if (POLICY[d.scope]) S.scope = d.scope;
        syncScopeButtons(composeScopes, S.scope);
        renderBand();
        renderPrimary();
      }
      $("backResult").hidden = true;
      announce("이어 쓰기로 돌아왔습니다. 공개 범위는 " + POLICY[S.scope].label + "입니다.");
    });

    $("btnSimView").addEventListener("click", simulateView);

    var changeScopes = $("scopeChange");
    changeScopes.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-scope]");
      if (btn) chooseNewScope(btn.getAttribute("data-scope"));
    });
    changeScopes.addEventListener("keydown", function (ev) {
      var keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
      if (keys.indexOf(ev.key) === -1) return;
      ev.preventDefault();
      var order = ["neighbor", "public", "private"];
      var cur = S.pendingScope || S.publishedScope || "neighbor";
      var idx = order.indexOf(cur);
      var next = (ev.key === "ArrowDown" || ev.key === "ArrowRight") ? (idx + 1) % 3 : (idx + 2) % 3;
      chooseNewScope(order[next]);
      var target = changeScopes.querySelector('[data-scope="' + order[next] + '"]');
      if (target) target.focus();
    });

    $("btnApplyScope").addEventListener("click", applyScope);
    $("notifyChk").addEventListener("change", function () {
      if (this.checked) announce("이미 본 이웃에게 공개 범위를 바꿨다고 알립니다.");
    });

    $("btnEdit").addEventListener("click", openEdit);
    $("btnCancelEdit").addEventListener("click", function () {
      show("published");
      announce("수정을 취소했습니다. 올린 글은 그대로입니다.");
    });
    $("btnKeepScope").addEventListener("click", function () { saveEdit("keepServer"); });
    $("btnChangeScope").addEventListener("click", function () { saveEdit("overwrite"); });
    $("btnRemote").addEventListener("click", simulateRemote);

    $("btnReset").addEventListener("click", function () {
      S.rev = 1;
      S.log = [];
      S.seen = 0;
      S.publishedScope = null;
      S.pendingScope = null;
      S.editScope = null;
      S.scope = "neighbor";
      syncScopeButtons(composeScopes, "neighbor");
      $("backResult").hidden = true;
      renderLedger();
      show("compose");
      announce("처음 상태로 돌아왔습니다. 공개 범위는 이웃 공개입니다.");
    });

    $("primary").addEventListener("click", function () {
      if (S.screen === "compose") publish();
      else if (S.screen === "published") openEdit();
      else saveEdit();
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

    /* 초기 복원 */
    var d = loadDraft();
    if (d) {
      $("fTitle").value = d.title;
      $("fBody").value = d.body;
      if (POLICY[d.scope]) S.scope = d.scope;
      syncScopeButtons(composeScopes, S.scope);
    } else {
      $("fTitle").value = S.title;
      $("fBody").value = S.body;
    }

    renderBand();
    renderPrimary();
    renderLedger();
    announce("공개 범위는 " + POLICY[S.scope].label + "입니다. 게시 버튼: " + POLICY[S.scope].button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
