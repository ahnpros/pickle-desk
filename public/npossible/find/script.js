(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };

  // ---- sample corpus (창작 예시) ----
  var DOCS = [
    {id:1, date:"2026-11-20", src:"뉴스", who:"기사", title:"전세대출 금리 다시 3%대… 은행권 문턱 낮춰", body:"주요 은행이 전세자금대출 금리를 0.2%p 내리면서 3%대 진입이 늘었다. 보증기관 한도도 함께 조정돼 실수요자 부담이 줄어들 전망이다.", tags:"전세 대출 금리 은행 부동산"},
    {id:2, date:"2026-02-11", src:"판", who:"사람", title:"전세 계약 앞두고 은행 세 곳 다녀온 후기", body:"금리는 3.4%에서 3.1%까지 차이가 났어요. 보증료까지 따져야 실제 부담이 보입니다. 서류는 미리 떼 가는 게 좋아요.", tags:"전세 대출 금리 후기 계약"},
    {id:3, date:"2026-11-18", src:"뉴스", who:"기사", title:"이번 주말 서울 아침 영하 3도… 첫 한파주의보", body:"찬 공기가 내려오면서 서울 아침 기온이 영하로 떨어진다. 수도관 동파와 난방 안전에 주의가 필요하다고 기상청이 밝혔다.", tags:"한파 날씨 겨울 기온"},
    {id:4, date:"2026-01-08", src:"뉴스", who:"기사", title:"겨울철 전기요금, 난방 방식 따라 두 배 차이", body:"전기 히터와 대류형 컨벡터의 소비전력 차이를 비교했다. 같은 실내 온도를 유지해도 월 요금이 크게 벌어졌다.", tags:"전기요금 겨울 난방 히터"},
    {id:5, date:"2026-11-14", src:"판", who:"사람", title:"김장 김치가 시어요, 원인이 뭘까요", body:"소금에 절이는 시간이 짧았던 것 같아요. 다음엔 하루 더 절여 보려고 합니다. 댓글들 감사합니다.", tags:"김장 김치 요리"},
    {id:6, date:"2026-11-16", src:"쪽지", who:"사람", title:"서연 님과의 쪽지 — 헬스장 시간대", body:"혹시 자곡동 헬스장 얘기하신 분이죠? 저도 같은 곳 다니는데 아침 7시가 한산해요.", tags:"헬스장 아침 운동"},
    {id:7, date:"2026-11-10", src:"판", who:"사람", title:"동네 헬스장 3개월 다닌 후기", body:"기구 이름도 몰라서 한참 서성였는데 지금은 아침 7시에 갑니다. 3개월권이 한 달씩 끊는 것보다 쌌어요.", tags:"헬스장 후기 운동 자곡동"},
    {id:8, date:"2026-11-19", src:"뉴스", who:"기사", title:"아이 독감 유행, 초등학교 결석 늘어", body:"독감 환자가 두 주 새 1.8배로 늘었다. 예방접종과 손 씻기가 여전히 가장 효과적인 방법이라고 전문가들은 말한다.", tags:"독감 아이 학교 건강"},
    {id:9, date:"2026-09-03", src:"검색기록", who:"사람", title:"내 검색어 — 자동차 보험 비교", body:"자동차보험 다이렉트 비교 찜목록. 3년 무사고 할인 특약.", tags:"자동차 보험 비교 할인"},
    {id:10, date:"2026-11-05", src:"뉴스", who:"기사", title:"3호선 지연 잇따라… 출근길 혼잡", body:"신호 장치 점검으로 3호선 열차가 10분가량 지연됐다. 대체 버스 투입은 없었다.", tags:"지하철 3호선 지연 출근"},
    {id:11, date:"2026-06-21", src:"판", who:"사람", title:"주말 등산 코스 추천해 주세요 (초보)", body:"북한산은 너무 셌고, 관악산은 사람이 많았어요. 2시간 정도 코스면 좋겠습니다.", tags:"등산 초보 코스 주말"},
    {id:12, date:"2026-11-21", src:"뉴스", who:"기사", title:"반도체 수출 3개월 연속 증가", body:"메모리 가격 상승이 이어지며 수출액이 늘었다. 설비 투자도 함께 회복되는 모습이다.", tags:"반도체 수출 메모리"},
    {id:13, date:"2025-12-02", src:"판", who:"사람", title:"작년 겨울 전세대출 갈아탄 이야기", body:"작년 이맘때 3%대 후반이었는데 지금은 더 낮아졌더라고요. 중도상환수수료 확인하세요.", tags:"전세 대출 금리 작년 겨울"},
    {id:14, date:"2026-11-17", src:"쪽지", who:"사람", title:"판돌이 님과의 쪽지 — 중고거래", body:"안녕하세요, 이웃으로 보고 인사드려요. 중고 거래 관련해서 여쭤볼 게 있어서요.", tags:"중고거래 이웃"},
    {id:15, date:"2026-10-30", src:"뉴스", who:"기사", title:"세탁기 10년 쓰면 전기요금 얼마나 늘까", body:"노후 가전의 대기전력과 효율 저하를 측정했다. 같은 사용량에도 요금 차이가 18% 났다.", tags:"세탁기 전기요금 가전"},
    {id:16, date:"2026-08-14", src:"검색기록", who:"사람", title:"내 검색어 — 수삼 세척 보관", body:"6년근 세척 수삼 냉동 보관 방법, 믹서 갈아 마시기.", tags:"수삼 보관 믹서 건강"},
    {id:17, date:"2026-11-12", src:"판", who:"사람", title:"아파트 관리비 겨울에 얼마나 오르나요", body:"난방비가 대부분이라 관리비 고지서 보고 놀랐습니다. 다른 단지도 비슷한가요?", tags:"아파트 관리비 난방 겨울"},
    {id:18, date:"2026-11-22", src:"뉴스", who:"기사", title:"전세 사기 예방, 계약 전 확인 서류 3가지", body:"등기부등본과 국세·지방세 완납증명, 보증보험 가입 가능 여부를 확인해야 한다. 최근 피해 사례를 정리했다.", tags:"전세 사기 계약 서류 보증"}
  ];

  var NOW = new Date("2026-11-22T14:00:00+09:00");
  var EXAMPLES = [
    "겨울에 본 기사인데 전세 대출 금리가 3%대였어",
    "아이 학교 독감 결석 얘기 봤는데",
    "작년에 혹시 전세 갈아탄 사람 후기",
    "전기요금 두 배 차이 난다는 글"
  ];

  function norm(s){ return (s||"").toLowerCase().replace(/[^\w가-힣%]+/g," ").replace(/\s+/g," ").trim(); }
  function bigrams(s){
    var out = [];
    for(var i=0;i<s.length-1;i++) out.push(s.slice(i,i+2));
    return out;
  }
  function daysAgo(dateStr){
    var d = new Date(dateStr+"T12:00:00+09:00");
    return Math.max(0, (NOW - d)/86400000);
  }

  function extractFragments(q){
    var raw = norm(q).split(" ").filter(Boolean);
    var frags = [], seen = {};
    var stop = {"그거":1,"있잖아":1,"혹시":1,"같은데":1,"봤는데":1,"인데":1,"얘기":1,"본":1,"때":1,"거":1,"좀":1,"것":1};
    raw.forEach(function(t){
      // 숫자+단위는 따로
      var m = t.match(/(\d+(\.\d+)?)%?/);
      var candidates = [t];
      if(m) candidates.push(m[1]+"%");
      candidates.forEach(function(c){
        c = c.replace(/[^\w가-힣%]/g,"");
        if(c.length<1 || stop[c] || seen[c]) return;
        seen[c]=1; frags.push(c);
      });
      // 2글자 이상 토큰은 앞부분 명사 후보도
      if(t.length>=4 && !stop[t]){
        var head = t.slice(0, Math.min(3, t.length));
        if(!seen[head]){ seen[head]=1; frags.push(head); }
      }
    });
    return frags.slice(0,12);
  }

  var FIELD = {title:3.0, tags:2.0, body:1.0};

  function fragScore(doc, frag){
    var f = norm(frag);
    if(!f) return {score:0, hit:null, how:""};
    var t = norm(doc.title), g = norm(doc.tags).replace(/ /g,""), b = norm(doc.body);
    var best = {score:0, hit:null, how:""};
    [["title",t,FIELD.title],["tags",g,FIELD.tags],["body",b,FIELD.body]].forEach(function(x){
      var field = x[0], text = x[1], w = x[2];
      if(text.indexOf(f)>=0){
        if(w > best.score){ best = {score:w, hit:field, how:"정확히 일치"}; }
        return;
      }
      // 부분 일치: 2글자 조각이 과반 들어 있으면
      var bg = bigrams(f);
      if(bg.length){
        var has = bg.filter(function(x){return text.indexOf(x)>=0;}).length;
        var ratio = has/bg.length;
        if(ratio>=0.6){
          var s = w*0.4*ratio;
          if(s > best.score){ best = {score:s, hit:field, how:"부분 일치 " + Math.round(ratio*100) + "%"}; }
        }
      }
    });
    return best;
  }

  var state = {frags:[], off:{}, last:null};

  function match(doc, frags){
    var total = 0, maxTotal = 0, details = [];
    frags.forEach(function(f){
      if(state.off[f]) return;
      maxTotal += Math.max(FIELD.title, FIELD.tags, FIELD.body);
      var r = fragScore(doc, f);
      total += r.score;
      if(r.score>0) details.push({frag:f, how:r.how, field:r.hit});
    });
    return {raw: total, norm: maxTotal ? total/maxTotal : 0, details: details};
  }

  function passes(doc){
    var when = $("f-when").value, where = $("f-where").value, who = $("f-who").value;
    if(where !== "any" && doc.src !== where) return false;
    if(who === "기사" && doc.who !== "기사") return false;
    if(who === "사람" && doc.who !== "사람") return false;
    if(when !== "any" && daysAgo(doc.date) > Number(when)) return false;
    return true;
  }

  function highlight(text, frags){
    var out = text, marks = [];
    frags.forEach(function(f){
      if(state.off[f]) return;
      if(f.length<2) return;
      var i = out.toLowerCase().indexOf(f.toLowerCase());
      if(i>=0) marks.push([i, i+f.length]);
    });
    if(!marks.length) return out.replace(/</g,"&lt;");
    marks.sort(function(a,b){return a[0]-b[0];});
    var merged = [marks[0]];
    marks.slice(1).forEach(function(m){
      var last = merged[merged.length-1];
      if(m[0] <= last[1]) last[1] = Math.max(last[1], m[1]); else merged.push(m);
    });
    var s = "", pos = 0;
    merged.forEach(function(m){
      s += escapeHtml(out.slice(pos, m[0])) + "<mark>" + escapeHtml(out.slice(m[0], m[1])) + "</mark>";
      pos = m[1];
    });
    s += escapeHtml(out.slice(pos));
    return s;
  }
  function escapeHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function renderChips(){
    var area = $("chipArea"), box = $("chips");
    if(!state.frags.length){ area.hidden = true; return; }
    area.hidden = false;
    box.innerHTML = state.frags.map(function(f){
      return '<button class="chip '+(state.off[f]?"off":"")+'" data-frag="'+escapeHtml(f)+'" aria-pressed="'+(!state.off[f])+'">'+escapeHtml(f)+'</button>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("[data-frag]"), function(b){
      b.addEventListener("click", function(){
        var f = b.getAttribute("data-frag");
        state.off[f] = !state.off[f];
        logLine("조각 " + (state.off[f] ? "끄기" : "켜기") + " — " + f);
        renderChips(); run(false);
      });
    });
  }

  function run(isNew){
    var q = $("q").value.trim();
    if(isNew){
      state.frags = extractFragments(q);
      state.off = {};
      renderChips();
    }
    var frags = state.frags.length ? state.frags : extractFragments(q);
    var hits = [];
    DOCS.forEach(function(doc){
      if(!passes(doc)) return;
      var m = match(doc, frags);
      if(m.norm <= 0 && frags.length) return;
      var decay = 1 + 0.15 * Math.max(0, 1 - daysAgo(doc.date)/365);
      hits.push({doc:doc, m:m, score: m.norm * decay});
    });
    hits.sort(function(a,b){ return b.score - a.score; });

    var box = $("results");
    if(!q){ box.innerHTML = '<div class="empty">찾고 싶은 걸 기억나는 대로 적어 보세요. 문장이어도 됩니다.</div>'; return; }

    if(!hits.length){
      box.innerHTML = '<div class="empty"><b>맞는 결과가 없어요.</b><br>기억 조각을 조금 바꿔 볼까요? 예: “전세 대출”, “겨울 난방”. '+
        '<br><span class="tiny">조각 추출: '+ (frags.length? escapeHtml(frags.join(" · ")) : "없음") +'</span></div>';
      logLine("결과 0건 — " + q);
      return;
    }

    var top = hits.slice(0,6);
    box.innerHTML = top.map(function(h, i){
      var d = h.doc, pct = Math.round(Math.min(1, h.score) * 100);
      var why = h.m.details.slice(0,4).map(function(x){ return x.frag + " (" + x.how + ")"; }).join(" · ");
      return '<div class="item">'+
        '<div class="top"><span class="pill '+(d.src==="뉴스"?"p":d.src==="판"?"g":"n")+'">'+d.src+'</span>'+
        '<span>'+d.date+'</span><span>·</span><span>'+(d.who==="기사"?"기사·보도":"사람이 쓴 글")+'</span>'+
        '<span style="margin-left:auto">일치 '+pct+'%</span></div>'+
        '<h3>'+highlight(d.title, frags)+'</h3>'+
        '<div class="snip">'+highlight(d.body, frags)+'</div>'+
        '<div class="scorebar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="whybox"><b>왜 이 결과인지</b> — '+escapeHtml(why || "시간 근접도만 반영")+
        (i===0?' · <b>최상위</b>':'')+'</div>'+
        '</div>';
    }).join("");
    if(top[0]) {
      $("results").setAttribute("aria-label", "검색 결과 " + top.length + "건");
    }
    logLine("검색 — " + q + " · 조각 " + frags.length + "개 · 결과 " + hits.length + "건 (상위 1: " + top[0].doc.title + ")");
  }

  var logs = [];
  function logLine(s){
    logs.unshift(new Date().toTimeString().slice(0,8) + "  " + s);
    $("log").textContent = logs.slice(0,12).join("\n");
  }

  // init
  $("corpusCount").textContent = String(DOCS.length);
  $("examples").innerHTML = EXAMPLES.map(function(e){
    return '<button class="ex" data-q="'+escapeHtml(e)+'">'+escapeHtml(e)+'</button>';
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll(".ex"), function(b){
    b.addEventListener("click", function(){
      $("q").value = b.getAttribute("data-q");
      run(true);
    });
  });
  $("go").addEventListener("click", function(){ run(true); });
  $("q").addEventListener("keydown", function(e){ if(e.key==="Enter") run(true); });
  ["f-when","f-where","f-who"].forEach(function(id){
    $(id).addEventListener("change", function(){ logLine("필터 — "+id+"="+$(id).value); run(false); });
  });

  var tabs = [["t1","p1"],["t2","p2"],["t3","p3"],["t4","p4"]];
  function selectTab(id){
    tabs.forEach(function(p){
      var on = p[0]===id;
      $(p[0]).setAttribute("aria-selected", String(on));
      $(p[1]).hidden = !on;
    });
  }
  tabs.forEach(function(p,i){
    var btn = $(p[0]);
    btn.addEventListener("click", function(){ selectTab(p[0]); window.scrollTo({top:0,behavior:"smooth"}); });
    btn.addEventListener("keydown", function(e){
      var n=null;
      if(e.key==="ArrowRight") n = tabs[(i+1)%tabs.length];
      if(e.key==="ArrowLeft") n = tabs[(i+tabs.length-1)%tabs.length];
      if(n){ e.preventDefault(); selectTab(n[0]); $(n[0]).focus(); }
    });
  });

  // prefill so a visitor sees results immediately
  $("q").value = EXAMPLES[0];
  run(true);
})();
