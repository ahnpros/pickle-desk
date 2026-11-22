(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var KEY = "sunpickle.npossible.draft.v1";
  var HIST = "sunpickle.npossible.draft.hist.v1";
  var META = "sunpickle.npossible.draft.meta.v1";
  var RET = "sunpickle.npossible.draft.retention";
  var IDLE_MS = 1000;
  var idTimed = null, lastHistAt = 0, lastSaveAt = 0, saveCount = 0, lastLatency = null;
  var dirty = false, lastReason = "";
  var TEST_KEY = "sunpickle.npossible.draft.expect";

  function nowClock(){
    var d = new Date();
    return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0") + ":" + String(d.getSeconds()).padStart(2,"0");
  }
  function bytes(s){ return new Blob([s]).size; }
  function readJSON(k, fb){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } }
  function writeJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

  function retention(){
    var v = parseInt(localStorage.getItem(RET) || "7", 10);
    return isNaN(v) ? 7 : v;
  }

  function expired(rec){
    if(!rec || !rec.savedAt) return false;
    return (Date.now() - rec.savedAt) > retention() * 24 * 3600 * 1000;
  }

  function clearAll(){
    [KEY, HIST, META].forEach(function(k){ localStorage.removeItem(k); });
  }

  function save(reason){
    lastReason = reason || lastReason || "입력 멈춤";
    var t = $("title").value, b = $("body").value;
    if(!t.trim() && !b.trim()){
      setState("empty");
      return;
    }
    dirty = false;
    var started = Date.now();
    var rec = { title:t, body:b, savedAt:Date.now(), savedClock:nowClock(), chars:b.length, titleChars:t.length };
    try{
      writeJSON(KEY, rec);
    }catch(e){
      setState("fail");
      return;
    }
    lastSaveAt = rec.savedAt;
    saveCount++;
    if(Date.now() - lastHistAt > 20000){
      var hist = readJSON(HIST, []);
      hist.unshift({ savedAt:rec.savedAt, savedClock:rec.savedClock, chars:b.length, titleChars:t.length, tail:b.slice(-30), title:t, body:b });
      hist = hist.slice(0, 3);
      try{ writeJSON(HIST, hist); }catch(e){}
      lastHistAt = Date.now();
    }
    lastLatency = Date.now() - started;
    setState("saved", rec);
    renderHist();
    renderStatus();
    renderMeasure();
  }

  function setState(kind, rec){
    var dot = $("saveDot"), text = $("saveText"), bar = $("saveBar");
    if(kind === "busy"){
      dot.className = "dot busy";
      text.textContent = "저장 중…";
      bar.style.width = "35%";
      bar.style.background = "#e8b23a";
      return;
    }
    if(kind === "saved"){
      dot.className = "dot";
      text.textContent = "저장됨 · " + rec.savedClock + " · 본문 " + rec.chars + "자" + (lastReason ? " (" + lastReason + ")" : "");
      bar.style.width = "100%";
      bar.style.background = "var(--green)";
      return;
    }
    if(kind === "fail"){
      dot.className = "dot busy";
      text.textContent = "저장하지 못했어요. 이 화면을 닫으면 글이 사라집니다.";
      bar.style.width = "100%";
      bar.style.background = "var(--red)";
      return;
    }
    dot.className = "dot wait";
    text.textContent = "아직 저장 전";
    bar.style.width = "0%";
  }

  function scheduleSave(){
    dirty = true;
    setState("busy");
    if(idTimed) clearTimeout(idTimed);
    idTimed = setTimeout(function(){ save("입력 멈춤"); }, IDLE_MS);
    renderStatus();
  }

  function renderStatus(){
    var t = $("title").value, b = $("body").value;
    $("headCount").textContent = b.length + "자";
    var rec = readJSON(KEY, null);
    var lines = [];
    if(!t.trim() && !b.trim()){
      lines.push("아직 아무것도 쓰지 않았습니다. 예시 글을 채워 보세요.");
    } else {
      lines.push("지금 화면: 제목 " + t.length + "자 · 본문 " + b.length + "자");
    }
    if(rec){
      lines.push("이 기기의 초안: " + rec.savedClock + " 저장 · 본문 " + rec.chars + "자");
      if(b.length > rec.chars) lines.push("아직 저장되지 않은 글자: " + (b.length - rec.chars) + "자 (1초 뒤 저장)");
    } else {
      lines.push("이 기기의 초안: 없음");
    }
    lines.push("보관 기한: " + retention() + "일 · 저장 위치: 이 브라우저 안 (서버 전송 없음)");
    $("statusBox").innerHTML = lines.map(function(l){ return "<div>· " + l + "</div>"; }).join("");
    $("retention").value = String(retention());
  }

  function renderHist(){
    var hist = readJSON(HIST, []);
    var box = $("histBox");
    if(!hist.length){ box.innerHTML = '<p class="tiny muted" style="margin:0">아직 기록이 없습니다. 글을 쓰면 20초 간격으로 남습니다.</p>'; return; }
    box.innerHTML = hist.map(function(h){
      return '<div class="hist"><div><b>' + h.savedClock + "</b> · 본문 " + h.chars + "자" +
        (h.tail ? '<div class="note">…' + esc(h.tail) + "</div>" : "") + "</div>" +
        '<button class="btn sm" data-restore="' + h.savedAt + '">이 지점에서</button></div>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("[data-restore]"), function(btn){
      btn.addEventListener("click", function(){
        var at = Number(btn.getAttribute("data-restore"));
        var hist2 = readJSON(HIST, []);
        var h = hist2.filter(function(x){ return x.savedAt === at; })[0];
        if(!h) return;
        $("title").value = h.title || "";
        $("body").value = h.body || h.tail || "";
        setState("busy");
        renderStatus();
        setTimeout(save, IDLE_MS);
      });
    });
  }

  function esc(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function renderRestore(){
    var slot = $("restoreSlot");
    var rec = readJSON(KEY, null);
    if(!rec){ slot.innerHTML = ""; return; }
    if(expired(rec)){
      localStorage.removeItem(KEY);
      slot.innerHTML = '<div class="restore" style="border-color:var(--line);background:#fafbfc">' +
        '<h4 style="color:#39414f">보관 기한이 지나 지웠어요</h4>' +
        '<div class="tiny muted">' + rec.savedClock + "에 저장된 초안입니다. 보관 기한은 " + retention() + "일입니다.</div></div>";
      return;
    }
    var tail = rec.body.slice(-40);
    slot.innerHTML = '<div class="restore">' +
      "<h4>쓰던 글이 있어요</h4>" +
      '<div class="tiny">' + rec.savedClock + " 저장 · 본문 " + rec.chars + "자" + (rec.titleChars ? " · 제목 " + rec.titleChars + "자" : "") + "</div>" +
      (tail ? '<div class="prev">여기까지 저장됐어요: …<span class="mark">' + esc(tail.slice(-24)) + "</span></div>" : "") +
      '<div class="row" style="margin:6px 0 0">' +
        '<button class="btn pri sm" id="btnResume">이어 쓰기</button>' +
        '<button class="btn sm" id="btnNew">새로 쓰기</button>' +
      "</div></div>";
    $("btnResume").addEventListener("click", function(){
      $("title").value = rec.title;
      $("body").value = rec.body;
      $("restoreSlot").innerHTML = '<div class="tiny" style="color:#0b6b3a;font-weight:700">' +
        rec.savedClock + "에 저장된 글을 그대로 불러왔어요. 이어서 쓰세요.</div>";
      setState("saved", rec);
      renderStatus();
      $("body").focus();
      var el = $("body");
      el.setSelectionRange(el.value.length, el.value.length);
    });
    $("btnNew").addEventListener("click", function(){
      $("title").value = ""; $("body").value = "";
      $("restoreSlot").innerHTML = '<div class="tiny muted">새로 씁니다. 이전 초안은 아래 저장 기록에 남아 있어요.</div>';
      renderStatus();
    });
  }

  function renderMeasure(){
    var rec = readJSON(KEY, null);
    var hist = readJSON(HIST, []);
    var b = $("body").value, t = $("title").value;
    var rows = [
      ["입력이 멈춘 뒤 저장까지", IDLE_MS + "ms (고정값, 타이머로 실제 동작)"],
      ["마지막 저장에 걸린 시간", lastLatency === null ? "아직 저장 안 함" : lastLatency + "ms (측정값)"],
      ["지금 저장된 글자", b.length + "자 · " + bytes(b) + "바이트"],
      ["초안으로 저장된 양", rec ? bytes(rec.body) + "바이트 (본문)" : "없음"],
      ["저장 기록 수", hist.length + " / 3"],
      ["저장 횟수(이번 화면)", saveCount + "회"]
    ];
    $("measureBox").innerHTML = "<table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody>" +
      rows.map(function(r){ return "<tr><td>" + r[0] + "</td><td><b>" + r[1] + "</b></td></tr>"; }).join("") +
      "</tbody></table><p class='tiny muted' style='margin-top:8px'>※ 글자 수와 바이트는 이 화면의 문자열에서 실제로 잰 값입니다. 1초는 제가 정한 지연값입니다.</p>";
  }

  // ---------- 이벤트 ----------
  $("title").addEventListener("input", scheduleSave);
  $("body").addEventListener("input", scheduleSave);
  $("title").addEventListener("blur", function(){ if(idTimed) clearTimeout(idTimed); save("입력창 벗어남"); });
  $("body").addEventListener("blur", function(){ if(idTimed) clearTimeout(idTimed); save("입력창 벗어남"); });

  // 입력이 이어지는 동안에도 2초마다 저장
  setInterval(function(){ if(dirty) save("주기 저장"); }, 2000);
  // 화면이 닫히거나 가려지는 순간 한 번 더
  window.addEventListener("pagehide", function(){ if(dirty) save("화면 닫힘"); });
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "hidden" && dirty) save("화면 가려짐"); });

  $("btnSample").addEventListener("click", function(){
    dirty = true;
    $("title").value = "아침에 지하철에서 가방을 주웠어요";
    $("body").value = "어제 저녁 7시쯤 3호선에서 어떤 분이 가방을 두고 내리셨어요. 바로 역무원한테 맡겼고, 연락처는 역무원에게만 알려 드렸어요. 가방 주인은 오늘 오후에 찾으러 온다고 하네요. 다음부터는 물건을 잘 챙겨야겠어요.";
    setState("busy");
    renderStatus();
    setTimeout(save, IDLE_MS);
  });

  $("btnReload").addEventListener("click", function(){
    if(idTimed) clearTimeout(idTimed);
    save();
    $("belowNote").textContent = "저장한 뒤 화면을 닫습니다…";
    setTimeout(function(){ location.reload(); }, 350);
  });

  $("btnBack").addEventListener("click", function(){
    save();
    $("belowNote").textContent = "뒤로 가도 이 기기에 저장됩니다. 화면을 닫아도 남습니다.";
  });

  $("btnClear").addEventListener("click", function(){
    clearAll();
    $("title").value = ""; $("body").value = "";
    $("restoreSlot").innerHTML = '<div class="tiny" style="color:#8f1f18">이 기기의 초안을 지웠어요. 되돌릴 수 없습니다.</div>';
    setState("empty");
    renderHist();
    renderStatus();
  });

  $("retention").addEventListener("change", function(){
    localStorage.setItem(RET, $("retention").value);
    renderStatus();
    renderRestore();
  });

  // 다른 탭에서 저장한 경우
  window.addEventListener("storage", function(e){
    if(e.key === KEY){ renderStatus(); renderRestore(); }
  });


  // ---------- v2 시험 ----------
  function showTestResult(){
    var expect = Number(localStorage.getItem(TEST_KEY) || "0");
    if(!expect) return;
    var rec = readJSON(KEY, null);
    var saved = rec ? rec.body.length : 0;
    var lost = Math.max(0, expect - saved);
    $("d6-out").innerHTML = "<b>입력 직후 닫기 결과</b><br>쓴 글자 " + expect + "자 · 저장된 글자 " + saved +
      "자 · 유실 " + lost + "자" + (lost === 0 ? " (닫히는 순간 저장이 동작함)" : " (닫히는 순간 저장이 못 따라감)");
    localStorage.removeItem(TEST_KEY);
  }
  if($("d6-instant")){
    $("d6-instant").addEventListener("click", function(){
      var t = $("title").value, b = $("body").value;
      if(!b.trim()) b = "가방을 주웠어요.";
      b += " 지금 막 쓴 문장입니다.";
      $("body").value = b;
      localStorage.setItem(TEST_KEY, String(b.length));
      location.reload();
    });
    $("d6-fail").addEventListener("click", function(){
      setState("fail");
      $("d6-out").innerHTML = "<span style='color:#8f1f18;font-weight:700'>저장 실패 상태를 띄웠어요.</span> 이 상태에서는 화면을 닫지 말라고 알립니다. 실제 저장소를 막은 것은 아니고 문장만 보여 줍니다.";
    });
    $("d6-recover").addEventListener("click", function(){
      setState("saved", readJSON(KEY, null) || {savedClock:nowClock(), chars:$("body").value.length});
      $("d6-out").textContent = "저장 상태로 돌아왔어요.";
    });
    showTestResult();
  }

  var tabs = [["t1","p1"],["t2","p2"],["t3","p3"],["t4","p4"],["t5","p5"],["t6","p6"]];
  function selectTab(id){
    tabs.forEach(function(pair){
      var on = pair[0] === id;
      $(pair[0]).setAttribute("aria-selected", String(on));
      $(pair[1]).hidden = !on;
    });
  }
  tabs.forEach(function(pair, i){
    var btn = $(pair[0]);
    btn.addEventListener("click", function(){ selectTab(pair[0]); window.scrollTo({top:0, behavior:"smooth"}); });
    btn.addEventListener("keydown", function(e){
      var n = null;
      if(e.key === "ArrowRight") n = tabs[(i+1) % tabs.length];
      if(e.key === "ArrowLeft") n = tabs[(i+tabs.length-1) % tabs.length];
      if(n){ e.preventDefault(); selectTab(n[0]); $(n[0]).focus(); }
    });
  });

  // 시작
  if(!localStorage.getItem(RET)) localStorage.setItem(RET, "7");
  renderRestore();
  renderHist();
  renderStatus();
  renderMeasure();
})();
