(function(){
  "use strict";
  var POLICY = {
    neighbor:{label:"이웃 공개", short:"이웃 12명", searchable:false,
      why:"이웃을 맺은 사람만 볼 수 있어요. 검색에는 안 나와요."},
    public:{label:"전체 공개", short:"전체 공개", searchable:true,
      why:"판 방문자 누구나 볼 수 있고 검색에도 잡혀요."},
    private:{label:"나만 보기", short:"나만", searchable:false,
      why:"저장만 하고 아무에게도 보여 주지 않아요."}
  };
  var ORDER = ["public","neighbor","private"];
  var $ = function(id){ return document.getElementById(id); };
  var state = {scope:"neighbor", touched:false, log:[], screen:"compose", announced:null, draftSaved:false};

  function clock(){ return new Date().toTimeString().slice(0,8); }
  function addLog(text, detail){
    state.log.push({t:clock(), text:text, detail:detail||""});
    renderLog();
  }
  function renderLog(){
    var box = $("log");
    if(!state.log.length){ box.textContent="(아직 아무 동작 없음)"; $("stepCount").textContent="0단계"; return; }
    box.innerHTML = state.log.map(function(l,i){
      var n = String(i+1).padStart(2,"0");
      return "<div><b>"+n+"</b> "+l.t+"  "+l.text+(l.detail?"  <span style='color:#8fb9a1'>"+l.detail+"</span>":"")+"</div>";
    }).join("");
    $("stepCount").textContent = state.log.length + "단계";
    box.scrollTop = box.scrollHeight;
  }
  function buttonLabel(scope){
    if(scope==="private") return "나만 보기로 저장";
    if(scope==="public") return "전체 공개로 게시";
    return POLICY[scope].short + "에게 게시";
  }
  function barLabel(scope){
    if(scope==="private") return "지금 나만 볼 수 있어요";
    if(scope==="public") return "전체 공개 중";
    return POLICY[scope].short + "에게 공개";
  }

  function render(){
    var p = POLICY[state.scope];
    $("scopeBar").classList.toggle("risk", state.scope==="public");
    $("barWho").textContent = barLabel(state.scope);
    $("barWhy").textContent = p.why + (state.touched ? "" : " · 기본값 그대로예요");
    var btn = $("btnPost");
    if(btn){
      btn.textContent = buttonLabel(state.scope);
      btn.classList.toggle("pri", true);
      btn.classList.toggle("risk", state.scope==="public");
      btn.setAttribute("aria-label", buttonLabel(state.scope) + " — " + p.why);
    }
    var cur = $("curScope"); if(cur) cur.textContent = p.short;
    ORDER.forEach(function(k){
      var el = $("opt-"+k);
      el.setAttribute("aria-checked", String(k===state.scope));
      el.tabIndex = (k===state.scope) ? 0 : -1;
    });
    $("pvScope").textContent = p.label + (p.searchable ? " · 검색 노출" : "");
    $("pvTitle").textContent = $("title").value || "(제목 없음)";
    $("pvBody").textContent = $("body").value;
    $("phSub").textContent = (state.draftSaved ? "초안 저장됨 · " : "") + (state.screen==="edit" ? "수정 중" : "첫 글");
    state.announced = "공개 범위가 " + p.short + "에게 공개로 바뀌었습니다. 게시 버튼: " + buttonLabel(state.scope) + ". " + p.why;
  }

  function setScope(scope){
    if(state.scope===scope) return;
    var before = state.scope;
    state.scope = scope; state.touched = true;
    addLog("공개 범위 변경", POLICY[before].label + " → " + POLICY[scope].label);
    render();
  }

  function sheetOpen(force){
    var s = $("sheet");
    var willOpen = force ? true : !s.classList.contains("open");
    s.classList.toggle("open", willOpen);
    s.inert = !willOpen;
    $("btnChange").setAttribute("aria-expanded", String(willOpen));
    if(willOpen){
      addLog("공개 범위 선택지 열기", "현재: " + POLICY[state.scope].label);
      $("opt-"+state.scope).focus();
    }
  }

  function showResult(){
    var p = POLICY[state.scope];
    addLog("게시 버튼 누름", "버튼 글자: " + buttonLabel(state.scope));
    var res = document.createElement("div");
    res.className = "result";
    res.innerHTML =
      '<div class="ok"><span class="check">✓</span> '+(state.scope==="private"?"나만 보기로 저장했어요":p.short+"에게 공개했어요")+'</div>'+
      '<div class="recon">'+
        '<div><span>내가 고른 값</span><b>'+p.label+'</b></div>'+
        '<div><span>실제 적용된 값</span><b>'+p.label+' ✓</b></div>'+
        '<div><span>검색 노출</span><b>'+(p.searchable?"노출됨 · 반영까지 최대 10분":"안 됨")+'</b></div>'+
      '</div>'+
      '<p class="tiny muted">'+p.why+'</p>'+
      '<div class="row"><button class="btn ghost" id="btnFix" style="flex:1">지금 바꾸기</button>'+
      '<button class="btn ghost" id="btnDone" style="flex:1">확인</button></div>';
    var foot = $("footbar");
    if(foot) foot.remove();
    $("phone").appendChild(res);
    addLog("게시 결과 표시", "고른 값 ↔ 실제 적용 값 대조: 일치");
    $("btnFix").addEventListener("click", function(){ res.remove(); buildFoot(); sheetOpen(true); });
    $("btnDone").addEventListener("click", function(){ res.remove(); buildFoot(); });
  }

  function buildFoot(){
    if($("footbar")) return;
    var bar = document.createElement("div");
    bar.className = "footbar"; bar.id = "footbar";
    bar.innerHTML = '<div class="cur"><span aria-hidden="true">👥</span><span>지금 <b id="curScope">'+POLICY[state.scope].short+'</b></span></div>'+
      '<button class="btn pri" id="btnPost">'+buttonLabel(state.scope)+'</button>';
    $("phone").appendChild(bar);
    $("btnPost").addEventListener("click", showResult);
    render();
  }

  $("btnChange").addEventListener("click", function(){ sheetOpen(false); });
  ORDER.forEach(function(k){
    var el = $("opt-"+k);
    el.addEventListener("click", function(){ setScope(k); });
    el.addEventListener("keydown", function(e){
      var i = ORDER.indexOf(k), n=null;
      if(e.key==="ArrowDown"||e.key==="ArrowRight") n = ORDER[(i+1)%ORDER.length];
      if(e.key==="ArrowUp"||e.key==="ArrowLeft") n = ORDER[(i+ORDER.length-1)%ORDER.length];
      if(n){ e.preventDefault(); setScope(n); $("opt-"+n).focus(); }
    });
  });
  $("btnPost").addEventListener("click", showResult);

  $("btnPreview").addEventListener("click", function(){
    var c = $("previewCard");
    c.hidden = !c.hidden;
    addLog("받는 사람 미리보기 " + (c.hidden?"닫기":"열기"), POLICY[state.scope].label);
    if(!c.hidden) c.scrollIntoView({behavior:"smooth", block:"nearest"});
  });

  $("btnBack").addEventListener("click", function(){
    state.draftSaved = true;
    addLog("뒤로 가기", "제목·본문·공개 범위를 함께 저장");
    render();
    var t = document.createElement("div");
    t.className = "result"; t.id = "draftNote";
    t.innerHTML = '<div class="ok"><span class="check">✓</span> 작성 중인 글을 저장했어요</div>'+
      '<p class="tiny muted">제목·본문·공개 범위('+POLICY[state.scope].label+')를 함께 저장했습니다. 다시 들어오면 이 자리에서 이어 씁니다.</p>'+
      '<div class="row"><button class="btn ghost" id="btnResume" style="flex:1">이어 쓰기</button></div>';
    var compose = document.querySelector(".compose");
    compose.style.display="none";
    $("sheet").classList.remove("open"); $("sheet").inert = true;
    if(!$("draftNote")) compose.after(t);
    $("btnResume").addEventListener("click", function(){
      t.remove(); compose.style.display="block"; addLog("이어 쓰기", "초안 복원");
    });
  });

  $("btnEdit").addEventListener("click", function(){
    state.screen="edit";
    $("phTitle").textContent="글 수정";
    addLog("수정 화면 열기", "상단 띠에 현재 공개 상태 표시");
    render();
    $("btnChange").focus();
  });

  $("btnSR").addEventListener("click", function(){
    var box = $("srBox");
    box.hidden = !box.hidden;
    if(!box.hidden){
      box.innerHTML = '<span>aria-live="polite" 로 읽히는 문장</span><br>'+(state.announced||"—")+
        '<br><br><span>버튼 접근 이름</span><br>'+buttonLabel(state.scope)+' — '+POLICY[state.scope].why;
      addLog("화면 낭독기 문장 확인");
    }
  });

  $("title").addEventListener("input", render);
  $("body").addEventListener("input", function(){
    $("bodyCount").textContent = "본문 "+$("body").value.length+"자 · 사진 0장";
    render();
  });

  $("btnReset").addEventListener("click", function(){
    state = {scope:"neighbor", touched:false, log:[], screen:"compose", announced:null, draftSaved:false};
    $("phTitle").textContent="판 글쓰기";
    $("title").value="동네 헬스장 3개월 다닌 후기";
    $("body").value="처음엔 기구 이름도 몰라서 한참 서성였어요. 지금은 아침 7시에 가면 사람이 적어서 좋더라고요. 혹시 자곡동 근처에 같이 다니실 분 있으면 댓글 주세요.";
    var r = document.querySelector(".result"); if(r) r.remove();
    document.querySelector(".compose").style.display="block";
    $("sheet").classList.remove("open"); $("sheet").inert = true;
    $("btnChange").setAttribute("aria-expanded","false");
    buildFoot();
    render(); renderLog();
  });


  // ---------- v2 데모 ----------
  var dA = {n12:true, drifted:false};
  if($("demoA-drift")){
    $("demoA-drift").addEventListener("click", function(){
      dA.drifted = true;
      $("demoA-now").innerHTML = "약 12명에게 공개 <span class='muted' style='font-weight:400'>(5분 전 기준)</span>";
      $("demoA-out").style.color = "#8a4b12";
      $("demoA-out").textContent = "이웃이 3명 나갔어요. 쓰는 중 화면은 캐시값이라 ‘약 12명’으로 표시합니다.";
      addLog("(데모 A) 이웃 3명 나감", "화면 캐시값은 ‘약 12명’으로 강등");
    });
    $("demoA-post").addEventListener("click", function(){
      var shown = dA.drifted ? "약 12명(캐시)" : "12명";
      var real = dA.drifted ? 9 : 12;
      $("demoA-out").style.color = "#0b6b3a";
      $("demoA-out").innerHTML = "게시 시점 재계산 → 실제 공개 대상 <b>이웃 "+real+"명</b> (화면 표시: "+shown+"). 결과 화면에는 확정값 ‘지금 이웃 "+real+"명에게 공개됐어요’를 씁니다.";
      addLog("(데모 A) 게시 — 서버 재계산", "표시 "+shown+" → 확정 이웃 "+real+"명");
    });
  }

  if($("demoB-post")){
    var conflict = false;
    $("demoB-other").addEventListener("click", function(){
      conflict = true;
      $("demoB-out").innerHTML = "<span style='color:#8a4b12'>다른 기기에서 ‘전체 공개’로 저장했어요. 이 화면은 아직 ‘이웃 12명’을 보여 줍니다.</span>";
      addLog("(데모 B) 다른 기기에서 범위 변경", "저장값: 전체 공개 / 이 화면: 이웃 12명");
    });
    $("demoB-post").addEventListener("click", function(){
      if(!conflict){
        $("demoB-out").innerHTML = "<span style='color:#0b6b3a;font-weight:700'>게시했어요 — 화면값과 저장값이 같습니다(이웃 12명).</span>";
        addLog("(데모 B) 게시 — 불일치 없음");
        return;
      }
      $("demoB-out").innerHTML = "<span style='color:#b45309;font-weight:700'>게시를 멈췄어요.</span> 저장된 값(전체 공개)과 화면 값(이웃 12명)이 달라요. " +
        "<button class='btn sm' id='demoB-fix' style='margin-left:6px'>다시 확인</button>";
      addLog("(데모 B) 게시 중단 — scope_rev 불일치", "저장값 전체 공개 ≠ 화면값 이웃 12명");
      $("demoB-fix").addEventListener("click", function(){
        $("demoB-out").innerHTML = "다시 확인했어요. 지금 저장된 범위는 <b>전체 공개</b>입니다. 이 범위로 올리려면 버튼을 한 번 더 눌러 주세요(‘전체 공개로 게시’).";
        addLog("(데모 B) 재확인 후 범위 동기화", "화면값 ← 저장값(전체 공개)");
      });
    });
  }

  if($("demoC-a-post")){
    var cA = 0, cB = 0;
    $("demoC-a-post").addEventListener("click", function(){
      cA++; $("demoC-a-count").textContent = cA;
      $("demoC-a-state").textContent = "확인 창이 떴지만 ‘누가 보는지’는 아직 안 보임";
      addLog("(데모 C) A 게시 누름", "탭 "+cA);
    });
    $("demoC-a-look").addEventListener("click", function(){
      cA++; $("demoC-a-count").textContent = cA;
      $("demoC-a-state").textContent = "이제 ‘누가 보는지’ 확인됨 — A는 총 "+cA+"탭 필요";
      addLog("(데모 C) A 확인 창 열기", "탭 "+cA);
    });
    $("demoC-b-look").addEventListener("click", function(){
      cB = 0; $("demoC-b-count").textContent = cB;
      $("demoC-b-state").textContent = "게시 버튼에 ‘이웃 12명에게 게시’ — 누르기 전에 이미 확인됨(0탭)";
      addLog("(데모 C) B 버튼 라벨 확인", "탭 0");
    });

    var quiz = {1:null,2:null,3:null};
    function quizRender(){
      var answered = Object.keys(quiz).filter(function(k){return quiz[k]!==null;}).length;
      if(!answered){ $("quizOut").textContent = ""; return; }
      var correct = Object.keys(quiz).filter(function(k){return quiz[k]===1;}).length;
      $("quizOut").innerHTML = answered+"문항 중 <b>"+correct+"개</b> 정답" + (answered===3 && correct===3 ? " — 라벨만으로 답이 됩니다." : "");
    }
    ["1","2","3"].forEach(function(k){
      Array.prototype.forEach.call(document.querySelectorAll(".q"+k), function(b){
        b.addEventListener("click", function(){
          quiz[k] = b.getAttribute("data-v") === "1" ? 1 : 0;
          b.style.outline = (quiz[k]===1) ? "2px solid #0f9d58" : "2px solid #d9534f";
          addLog("(데모 C) 이해 확인 "+k+"문항", quiz[k]===1 ? "정답" : "오답");
          quizRender();
        });
      });
    });
  }

  var tabs = [["t1","p1"],["t2","p2"],["t3","p3"],["t4","p4"],["t5","p5"]];
  function selectTab(id){
    tabs.forEach(function(pair){
      var on = pair[0]===id;
      $(pair[0]).setAttribute("aria-selected", String(on));
      $(pair[1]).hidden = !on;
    });
  }
  tabs.forEach(function(pair,i){
    var btn = $(pair[0]);
    btn.addEventListener("click", function(){ selectTab(pair[0]); window.scrollTo({top:0,behavior:"smooth"}); });
    btn.addEventListener("keydown", function(e){
      var n=null;
      if(e.key==="ArrowRight") n = tabs[(i+1)%tabs.length];
      if(e.key==="ArrowLeft") n = tabs[(i+tabs.length-1)%tabs.length];
      if(n){ e.preventDefault(); selectTab(n[0]); $(n[0]).focus(); }
    });
  });

  $("sheet").inert = true;
  render(); renderLog();
})();
