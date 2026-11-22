(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };

  // ---------- 예시 글 버전 (지어낸 글, 개인정보 아님) ----------
  var VERSIONS = [
    { v:1, time:"11:02", who:"처음 올림",
      text:"어제 저녁 7시쯤 3호선에서 한 아저씨가 가방을 두고 내리셨어요. 바로 역무원한테 맡겼는대, 제 번호 010-2345-6789를 적어 두라고 했어요. 가방 주인은 오늘 오후에 찾으러 온다고 하네요. 역무원실에서는 오후 6시 전에 찾는 것이 허용돼요. 다음부터는 물건을 잘 챙겨야겠어요." },
    { v:2, time:"11:31", who:"맞춤법",
      text:"어제 저녁 7시쯤 3호선에서 한 아저씨가 가방을 두고 내리셨어요. 바로 역무원한테 맡겼는데, 제 번호 010-2345-6789를 적어 두라고 했어요. 가방 주인은 오늘 오후에 찾으러 온다고 하네요. 역무원실에서는 오후 6시 전에 찾는 것이 허용돼요. 다음부터는 물건을 잘 챙겨야겠어요." },
    { v:3, time:"12:04", who:"연락처 정리",
      text:"어제 저녁 7시쯤 3호선에서 한 아저씨가 가방을 두고 내리셨어요. 바로 역무원한테 맡겼는데, 연락처는 역무원에게만 알려 드렸어요. 가방 주인은 오늘 오후에 찾으러 온다고 하네요. 역무원실에서는 오후 6시 전에 찾는 것이 허용돼요. 다음부터는 물건을 잘 챙겨야겠어요." },
    { v:4, time:"12:40", who:"내용 정정",
      text:"어제 저녁 7시쯤 2호선에서 한 아저씨가 가방을 두고 내리셨어요. 바로 역무원한테 맡겼는데, 연락처는 역무원에게만 알려 드렸어요. 가방 주인은 내일 오후에 찾으러 온다고 하네요. 역무원실에서는 오후 6시 전에 찾는 것이 허용돼요. 다음부터는 물건을 잘 챙겨야겠어요." },
    { v:5, time:"13:12", who:"찾는 시간 정정",
      text:"어제 저녁 7시쯤 2호선에서 한 아저씨가 가방을 두고 내리셨어요. 바로 역무원한테 맡겼는데, 연락처는 역무원에게만 알려 드렸어요. 가방 주인은 내일 오후에 찾으러 온다고 하네요. 역무원실에서는 오후 6시 전에 찾는 것이 금지돼요. 다음부터는 물건을 잘 챙겨야겠어요." }
  ];

  var COMMENTS = [
    { id:"c1", who:"판 이용자", time:"11:20", anchor:1,
      body:"역무원한테 맡기셨다니 다행이네요. 잘 처리되길 바랍니다." },
    { id:"c2", who:"골목길", time:"11:50", anchor:2,
      body:"오늘 오후에 찾으러 온다니 조금만 기다리면 되겠네요." }
  ];

  // ---------- 비교 도구 ----------
  var PHONE = /(0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4})/;
  var EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  var ACCOUNT = /\d{2,6}-\d{2,6}-\d{2,6}/;
  var RRN = /\d{6}[-\s]?\d{7}/;
  var CARD = /\b(\d{4}[-\s]?){3}\d{3,4}\b/;
  var ADDRESS = /((서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\s]{0,6}\s?[가-힣]{1,5}(구|군)\s?[가-힣]{1,6}(동|읍|면|로|길)\s?\d{1,5})/;
  var ANTONYM = [["허용","금지"],["가능","불가"],["찬성","반대"],["늘","줄"],["좋","나쁘"],["높","낮"],["시작","종료"],["공개","비공개"],["포함","제외"],["참여","불참"]];
  var NEG = /(안|못|없|아니|않)/;
  var TIME = /(오늘|내일|모레|어제|글피|이번\s*주|다음\s*주|아침|점심|저녁|밤|새벽)/;
  var LINE = /(\d+\s*호선|분당선|신분당선|경의중앙선|공항철도|공항철도)/;

  function sentences(t){
    return t.split(/(?<=[.!?])\s+/).map(function(s){ return s.trim(); }).filter(Boolean);
  }
  function words(s){
    return s.split(/(\s+)/).filter(function(w){ return w.length > 0; });
  }
  // LCS 기반 토큰 비교
  function lcsOps(a, b){
    var n = a.length, m = b.length;
    var dp = [];
    for(var i=0;i<=n;i++){ dp.push(new Array(m+1).fill(0)); }
    for(var i=n-1;i>=0;i--){
      for(var j=m-1;j>=0;j--){
        dp[i][j] = (a[i]===b[j]) ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
      }
    }
    var ops = [], i=0, j=0;
    while(i<n && j<m){
      if(a[i]===b[j]){ ops.push({t:"=", v:a[i]}); i++; j++; }
      else if(dp[i+1][j] >= dp[i][j+1]){ ops.push({t:"-", v:a[i]}); i++; }
      else { ops.push({t:"+", v:b[j]}); j++; }
    }
    while(i<n){ ops.push({t:"-", v:a[i++]}); }
    while(j<m){ ops.push({t:"+", v:b[j++]}); }
    return ops;
  }
  function joinType(ops, type){
    return ops.filter(function(o){ return o.t===type; }).map(function(o){ return o.v; }).join("");
  }
  function digits(s){ return (s.match(/\d+/g) || []).join(","); }

  function classify(removed, inserted){
    var signals = [];
    if(PHONE.test(removed) || EMAIL.test(removed) || ACCOUNT.test(removed) || RRN.test(removed) || CARD.test(removed) || ADDRESS.test(removed)){
      signals.push("전화번호·메일·계좌·주소 모양이 사라짐");
      return { kind:"privacy", signals:signals };
    }
    var dR = (removed.match(/\d+/g) || []), dI = (inserted.match(/\d+/g) || []);
    if(dR.join(",") !== dI.join(",")){ signals.push("숫자 " + Math.max(dR.length, dI.length) + "개 바뀜"); }
    var negR = NEG.test(removed), negI = NEG.test(inserted);
    if(negR !== negI){ signals.push("부정어가 " + (negI ? "생김" : "사라짐")); }
    var lineR = (removed.match(LINE)||[]).join(","), lineI = (inserted.match(LINE)||[]).join(",");
    if(lineR !== lineI){ signals.push("노선 이름이 바뀜"); }
    var timeR = (removed.match(TIME)||[]).join(","), timeI = (inserted.match(TIME)||[]).join(",");
    if(timeR !== timeI){ signals.push("시점 표현이 바뀜"); }
    var pnR = removed.replace(/\s/g,""), pnI = inserted.replace(/\s/g,"");
    var placeR = removed.match(/(\d+\s*호선|[가-힣]{2,}역)/g) || [];
    var placeI = inserted.match(/(\d+\s*호선|[가-힣]{2,}역)/g) || [];
    if(placeR.join("|") !== placeI.join("|") && !lineR && !lineI){ signals.push("장소 표현이 바뀜"); }
    var ant = "";
    ANTONYM.forEach(function(pair){
      var a = pair[0], b = pair[1];
      if((removed.indexOf(a) >= 0 && inserted.indexOf(b) >= 0) || (removed.indexOf(b) >= 0 && inserted.indexOf(a) >= 0)){
        ant = a + " → " + b;
      }
    });
    if(ant){ signals.push("반대말로 바뀜(" + ant + ")"); }
    if(signals.length){ return { kind:"meaning", signals:signals }; }
    if((removed.length >= 12 && inserted.length <= removed.length - 8)){
      return { kind:"check", signals:["긴 문장이 통째로 줄어듦", "개인정보인지 확인 필요"] };
    }
    return { kind:"expression", signals:["숫자·부정어·고유명사·반대말 변화 없음"] };
  }

  function diffSentences(oldText, newText){
    var A = sentences(oldText), B = sentences(newText);
    var ops = lcsOps(A, B);
    var blocks = [];
    var i = 0, prevDel = null;
    // 연속 삭제/추가는 문장 교체로 묶는다
    for(var k=0;k<ops.length;k++){
      var o = ops[k];
      if(o.t === "="){ prevDel = null; continue; }
      if(o.t === "-"){
        var next = ops[k+1];
        if(next && next.t === "+"){
          var w = lcsOps(words(o.v), words(next.v));
          var removed = joinType(w, "-"), inserted = joinType(w, "+");
          blocks.push({ idx:A.indexOf(o.v), before:o.v, after:next.v, ops:w, removed:removed, inserted:inserted });
          k++;
        } else {
          blocks.push({ idx:A.indexOf(o.v), before:o.v, after:null, ops:[{t:"-", v:o.v}], removed:o.v, inserted:"" });
        }
      } else if(o.t === "+"){
        var prev = ops[k-1];
        if(prev && prev.t === "-"){ continue; } // 위에서 이미 묶었다
        var nxt = ops[k+1];
        if(nxt && nxt.t === "-"){
          var w2 = lcsOps(words(nxt.v), words(o.v));
          blocks.push({ idx:A.indexOf(nxt.v), before:nxt.v, after:o.v, ops:w2,
            removed:joinType(w2, "-"), inserted:joinType(w2, "+") });
          k++;
        } else {
          blocks.push({ idx:null, before:null, after:o.v, ops:[{t:"+", v:o.v}], removed:"", inserted:o.v });
        }
      }
    }
    blocks.forEach(function(b){ b.verdict = classify(b.removed, b.inserted); });
    return blocks;
  }

  // ---------- 편집 이력 계산 ----------
  var EDITS = [];
  for(var vi=1; vi<VERSIONS.length; vi++){
    var a = VERSIONS[vi-1], b = VERSIONS[vi];
    var blocks = diffSentences(a.text, b.text);
    var kind = "expression";
    if(blocks.some(function(x){ return x.verdict.kind === "privacy"; })) kind = "privacy";
    else if(blocks.some(function(x){ return x.verdict.kind === "meaning"; })) kind = "meaning";
    EDITS.push({ from:a.v, to:b.v, time:b.time, who:b.who, blocks:blocks, kind:kind });
  }

  var KIND = {
    expression:{ label:"표현 수정", pill:"n", desc:"글자·조사만 바뀌었습니다." },
    meaning:{ label:"뜻이 바뀐 수정", pill:"a", desc:"숫자나 부정어나 반대말이 바뀌어 읽는 뜻이 달라질 수 있습니다." },
    privacy:{ label:"개인정보 삭제", pill:"b", desc:"지워진 값은 저장하지도 보여 주지도 않습니다." },
    check:{ label:"확인 필요", pill:"n", desc:"긴 문장이 줄었는데 개인정보 모양이 없습니다. 작성자에게 한 번 묻고, 답 전에는 내용을 접습니다." }
  };

  function esc(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function diffHtml(ops){
    var out = "";
    ops.forEach(function(o, i){
      var prev = ops[i-1];
      if(prev && ((prev.t === "-" && o.t === "+") || (prev.t === "+" && o.t === "-"))) out += " ";
      if(o.t === "=") out += esc(o.v);
      else if(o.t === "-") out += '<span class="del">' + esc(o.v) + "</span>";
      else out += '<span class="ins">' + esc(o.v) + "</span>";
    });
    return out;
  }

  var view = "reader";

  function changedSentencesFor(idx){
    // 그 문장이 뜻/개인정보 수준으로 바뀐 편집만
    var hits = [];
    EDITS.forEach(function(e){
      e.blocks.forEach(function(b){
        if(b.verdict.kind === "expression") return;
        if(b.idx === idx) hits.push({ edit:e, block:b });
      });
    });
    return hits;
  }

  function renderPost(){
    var last = VERSIONS[VERSIONS.length-1];
    $("postBody").textContent = last.text;
    $("editedBadge").textContent = "수정됨 · " + (VERSIONS.length-1) + "번 고침";
    var meaning = EDITS.filter(function(e){ return e.kind === "meaning"; }).length;
    var privacy = EDITS.filter(function(e){ return e.kind === "privacy"; }).length;
    var parts = [];
    if(meaning) parts.push("뜻이 바뀐 수정 " + meaning + "건");
    if(privacy) parts.push("개인정보 삭제 " + privacy + "건");
    $("commentHint").textContent = parts.join(" · ");
  }

  function renderComments(){
    var box = $("comments");
    box.innerHTML = COMMENTS.map(function(c){
      var hits = changedSentencesFor(c.anchor);
      var warn = "";
      if(hits.length){
        var h = hits[hits.length-1];
        var level = h.block.verdict.kind === "privacy" ? "개인정보가 지워진" : "뜻이 바뀐";
        warn = '<div class="warnbox" style="margin:6px 0;padding:7px 9px;font-size:12px">' +
          "댓글을 단 문장이 " + h.edit.time + " 수정에서 " + level + " 문장이에요. " +
          (h.block.verdict.kind === "privacy"
            ? "무엇이 지워졌는지는 표시하지 않습니다."
            : '<button class="btn sm" data-goto="' + h.block.idx + '">바뀐 곳 보기</button>') +
          "</div>";
      }
      return '<div class="cmt"><div class="who">' + esc(c.who) + " · " + c.time + "</div>" +
        '<div class="small">' + esc(c.body) + "</div>" + warn + "</div>";
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("[data-goto]"), function(btn){
      btn.addEventListener("click", function(){
        var card = document.querySelector('[data-anchor="' + btn.getAttribute("data-goto") + '"]');
        if(card){ card.scrollIntoView({behavior:"smooth", block:"center"}); card.style.outline = "2px solid var(--amber-line)";
          setTimeout(function(){ card.style.outline = "none"; }, 1600); }
      });
    });
  }

  function renderChanges(){
    var list = $("changeList");
    var items = EDITS.slice().reverse();
    var html = "";
    var folded = 0;
    items.forEach(function(e){
      if(view === "reader" && e.kind === "expression"){ folded++; return; }
      var k = KIND[e.kind];
      var body = "";
      e.blocks.forEach(function(b){
        if(view === "reader" && b.verdict.kind === "expression") return;
        if(b.verdict.kind === "check"){
          body += '<div class="privacy" data-anchor="' + (b.idx === null ? "" : b.idx) + '">' +
            "<b>지워진 부분이 있어요. 개인정보인지 확인이 필요합니다.</b> 확인 전에는 내용을 저장하지 않고, 작성자에게 한 번 묻습니다. " +
            "<br><span class='tiny muted'>판정 근거: " + esc(b.verdict.signals.join(" / ")) + "</span></div>";
          return;
        }
        if(b.verdict.kind === "privacy"){
          body += '<div class="privacy" data-anchor="' + (b.idx === null ? "" : b.idx) + '">' +
            "<b>전화번호가 지워졌어요.</b> 지워진 값과 그 앞뒤 문장은 저장하지도, 비교해서 보여 주지도 않습니다. " +
            "남는 것은 유형과 시각뿐입니다.<br><span class='tiny muted'>판정 근거: " + esc(b.verdict.signals.join(" / ")) + "</span></div>";
          return;
        }
        body += '<div class="diff" data-anchor="' + (b.idx === null ? "" : b.idx) + '">' + diffHtml(b.ops) + "</div>" +
          '<div class="why">판정 근거: <b>' + esc(b.verdict.signals.join(" / ")) + "</b></div>";
        if(b.verdict.kind === "meaning" && b.idx !== null){
          var cmts = COMMENTS.filter(function(c){ return c.anchor === b.idx; });
          if(cmts.length){ body += '<div class="tiny muted" style="margin-top:4px">이 문장에 단 댓글 ' + cmts.length + "개가 있습니다.</div>"; }
        }
      });
      if(!body) return;
      html += '<div class="chg"><h5><span class="pill ' + k.pill + '">' + k.label + "</span>" +
        '<span class="when">' + e.time + " · " + esc(e.who) + "</span></h5>" + body +
        '<div class="why">' + k.desc + "</div></div>";
    });
    if(folded){
      html += '<div class="tiny muted" style="padding:2px 4px">표현 수정 ' + folded +
        "건은 독자 화면에 접혀 있습니다. 작성자로 보면 전부 나옵니다.</div>";
    }
    list.innerHTML = html;
    $("chgCount").textContent = "(" + EDITS.length + "건)";
    $("viewNote").textContent = view === "reader"
      ? "독자에게는 뜻이 바뀐 수정과 개인정보 삭제만 알립니다. 맞춤법만 고친 수정은 접혀 있습니다."
      : "작성자에게는 자기 글의 모든 수정이 보입니다. 표현 수정도 전후를 확인할 수 있습니다.";
  }

  function renderRules(){
    var serious = EDITS.filter(function(e){ return e.kind !== "expression"; });
    var rows = serious.map(function(e){
      var b = e.blocks.filter(function(x){ return x.verdict.kind !== "expression"; })[0];
      return "<tr><td>" + e.time + "</td><td>" + KIND[e.kind].label + "</td><td>" +
        (e.kind === "privacy" ? "내용 비공개" : esc((b.removed||"").slice(0,18) + " → " + (b.inserted||"").slice(0,18))) + "</td></tr>";
    }).join("");
    $("ruleBox").innerHTML =
      '<table><thead><tr><th>시각</th><th>판정</th><th>바뀐 것</th></tr></thead><tbody>' +
      rows + "</tbody></table>" +
      '<p class="tiny muted" style="margin-top:8px">이 표는 위 예시 글의 수정 ' + EDITS.length + "건을 실제로 비교해 만든 결과입니다. 판정은 아래 규칙으로 계산합니다.</p>" +
      '<pre style="font-size:11.5px">사라진 토막에 전화번호·계좌·주소 모양 → 개인정보 삭제(내용 비저장)\n숫자·부정어·노선·시점·반대말 변화 → 뜻이 바뀐 수정\n긴 문장이 크게 줄었는데 모양이 없음 → 확인 필요\n그 밖 → 표현 수정</pre>';
  }

  function bytes(s){ return new Blob([s]).size; }

  function renderCost(){
    var full = VERSIONS.reduce(function(n,v){ return n + bytes(v.text); }, 0);
    var changeOnly = 0, contentChars = 0, privacySaved = 0;
    EDITS.forEach(function(e){
      e.blocks.forEach(function(b){
        if(b.verdict.kind === "check"){
          body += '<div class="privacy" data-anchor="' + (b.idx === null ? "" : b.idx) + '">' +
            "<b>지워진 부분이 있어요. 개인정보인지 확인이 필요합니다.</b> 확인 전에는 내용을 저장하지 않고, 작성자에게 한 번 묻습니다. " +
            "<br><span class='tiny muted'>판정 근거: " + esc(b.verdict.signals.join(" / ")) + "</span></div>";
          return;
        }
        if(b.verdict.kind === "privacy"){ privacySaved += bytes(b.before || ""); return; }
        changeOnly += bytes(b.removed) + bytes(b.inserted) + 40; // 문장당 메타데이터 40바이트 가정
        contentChars += b.removed.length + b.inserted.length;
      });
    });
    $("costBox").innerHTML =
      '<table><thead><tr><th>저장 방식</th><th>저장하는 양</th><th>비고</th></tr></thead><tbody>' +
      "<tr><td>버전마다 글 전체를 저장</td><td><b>" + full.toLocaleString() + " 바이트</b></td><td>글 " + VERSIONS.length + "개</td></tr>" +
      "<tr><td>바뀐 문장만 저장 (이 화면 방식)</td><td><b>" + changeOnly.toLocaleString() + " 바이트</b></td><td>바뀐 글자 " + contentChars + "자 + 문장 메타데이터(40바이트 가정)</td></tr>" +
      "<tr><td>개인정보 삭제분</td><td><b>내용 0 바이트</b></td><td>원문 " + privacySaved.toLocaleString() + " 바이트를 저장하지 않음</td></tr>" +
      "</tbody></table>" +
      '<p class="tiny muted" style="margin-top:8px">※ 40바이트는 제가 정한 가정값이고, 실제 서버 스키마에 따라 달라집니다. 나머지 숫자는 이 페이지의 문자열을 실제로 잰 값입니다.</p>';
  }

  function setView(v){
    view = v;
    $("viewReader").setAttribute("aria-pressed", String(v === "reader"));
    $("viewAuthor").setAttribute("aria-pressed", String(v === "author"));
    renderChanges();
  }

  $("viewReader").addEventListener("click", function(){ setView("reader"); });
  $("viewAuthor").addEventListener("click", function(){ setView("author"); });
  $("btnChanges").addEventListener("click", function(){
    var open = $("btnChanges").getAttribute("aria-expanded") === "true";
    $("btnChanges").setAttribute("aria-expanded", String(!open));
    $("changeWrap").scrollIntoView({behavior:"smooth", block:"start"});
  });


  // ---------- v2 판정 시험대 ----------
  function runTest(){
    var a = $("tA").value.trim(), b = $("tB").value.trim();
    if(!a || !b){ $("testOut").textContent = "두 문장을 모두 넣어 주세요."; return; }
    var w = lcsOps(words(a), words(b));
    var removed = joinType(w, "-"), inserted = joinType(w, "+");
    var v = classify(removed, inserted);
    var k = KIND[v.kind] || KIND.expression;
    var label = v.kind === "privacy" ? "개인정보 삭제" : (v.kind === "check" ? "확인 필요" : k.label);
    var showDiff = v.kind === "privacy" ? "<span style='color:#0b6b3a;font-weight:700'>지워진 내용은 표시하지 않습니다.</span>" : diffHtml(w);
    var note = v.kind === "check" ? " 확인 전에는 저장하지 않고 작성자에게 한 번 묻습니다." : "";
    $("testOut").innerHTML = '<div style="margin-bottom:6px"><span class="pill ' + k.pill + '">' + label + "</span></div>" +
      '<div class="diff">' + showDiff + "</div>" +
      '<div class="why">판정 근거: <b>' + esc(v.signals.join(" / ")) + "</b>" + note + "</div>";
  }
  if($("testRun")){
    $("testRun").addEventListener("click", runTest);
    $("testAddr").addEventListener("click", function(){
      $("tA").value = "제 집은 서울 서초구 내곡동 123-45이고 가방은 역무원실에 있어요.";
      $("tB").value = "가방은 역무원실에 있어요.";
      runTest();
    });
    $("testLong").addEventListener("click", function(){
      $("tA").value = "어제 그 가방은 역무원실에서 오후 여섯 시 전에 찾을 수 있었고 제가 직접 확인했어요.";
      $("tB").value = "가방은 역무원실에 있어요.";
      runTest();
    });
    runTest();
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

  renderPost();
  renderComments();
  renderChanges();
  renderRules();
  renderCost();
})();
