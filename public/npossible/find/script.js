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
    {id:6, date:"2026-11-16", src:"쪽지", who:"사람", title:"서연 님과의 쪽지 — 헬스장 시간대", body:"혹시 문정동 헬스장 얘기하신 분이죠? 저도 같은 곳 다니는데 아침 7시가 한산해요.", tags:"헬스장 아침 운동"},
    {id:7, date:"2026-11-10", src:"판", who:"사람", title:"동네 헬스장 3개월 다닌 후기", body:"기구 이름도 몰라서 한참 서성였는데 지금은 아침 7시에 갑니다. 3개월권이 한 달씩 끊는 것보다 쌌어요.", tags:"헬스장 후기 운동 문정동"},
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
    {id:18, date:"2026-11-22", src:"뉴스", who:"기사", title:"전세 사기 예방, 계약 전 확인 서류 3가지", body:"등기부등본과 국세·지방세 완납증명, 보증보험 가입 가능 여부를 확인해야 한다. 최근 피해 사례를 정리했다.", tags:"전세 사기 계약 서류 보증"},
    {id:19, date:"2026-11-19", src:"뉴스", who:"기사", title:"전세보증금 반환 지연, 임차인 권리 어떻게", body:"계약 만료 후 보증금을 돌려받지 못한 사례가 늘고 있다. 내용증명과 임차권등기명령 절차를 정리했다.", tags:"전세 보증금 반환 임차인"},
    {id:20, date:"2026-10-12", src:"판", who:"사람", title:"겨울 등산 준비물 뭐 챙기세요?", body:"방한 장갑과 아이젠은 필수인 것 같아요. 물은 보온병에 넣어 가면 좋습니다.", tags:"등산 겨울 준비물"},
    {id:21, date:"2026-03-05", src:"뉴스", who:"기사", title:"금리 인하 신호에 대출 수요 다시 늘어", body:"시장금리가 내리면서 주택담보대출 문의가 늘었다. 은행들은 우대금리 조건을 조정하고 있다.", tags:"금리 대출 수요 주택담보"},
    {id:22, date:"2026-11-21", src:"뉴스", who:"기사", title:"서울시 버스 노선 개편, 12월부터 적용", body:"간선·지선 노선 18개가 조정된다. 출퇴근 시간대 배차 간격도 함께 바뀐다.", tags:"버스 노선 서울 개편"},
    {id:23, date:"2026-07-08", src:"판", who:"사람", title:"아이 독감 걸렸을 때 학교 며칠 쉬나요", body:"해열제 먹이고 48시간 지나면 보내도 된다고 들었는데, 학교마다 기준이 다르더라고요.", tags:"독감 학교 아이 등교"},
    {id:24, date:"2026-11-02", src:"검색기록", who:"사람", title:"내 검색어 — 겨울 난방비 절약", body:"난방비 절약 방법, 보일러 온도 적정선, 창문 단열 필름.", tags:"난방비 겨울 절약 보일러"},
    {id:25, date:"2026-11-06", src:"뉴스", who:"기사", title:"전기히터 화재 주의보, 소비전력 먼저 확인", body:"겨울철 전기히터 사용이 늘면서 화재 신고가 증가했다. 문어발식 콘센트 사용을 피해야 한다.", tags:"전기히터 화재 소비전력 겨울"},
    {id:26, date:"2026-11-15", src:"쪽지", who:"사람", title:"도윤 님과의 쪽지 — 주말 등산", body:"이번 주말에 관악산 가실래요? 2시간 코스로 잡으면 초보도 괜찮아요.", tags:"등산 주말 코스 관악산"},
    {id:27, date:"2025-11-30", src:"뉴스", who:"기사", title:"작년 겨울 한파, 12월 초에 절정", body:"12월 첫 주에 영하 10도까지 떨어졌던 기록이 있다. 올해도 비슷한 흐름이 예상된다.", tags:"한파 겨울 기록 영하"},
    {id:28, date:"2026-09-19", src:"판", who:"사람", title:"중고 세탁기 팔아요 (10년 사용)", body:"작동은 잘 되는데 소음이 좀 있습니다. 직접 가져가실 분만 연락 주세요.", tags:"중고 세탁기 판매"},
    {id:29, date:"2026-11-13", src:"뉴스", who:"기사", title:"반도체 설비 투자 회복 조짐", body:"장비 발주가 늘면서 내년 설비 투자 전망이 상향됐다. 소재·부품 업종도 함께 움직인다.", tags:"반도체 설비 투자"},
    {id:30, date:"2026-08-20", src:"검색기록", who:"사람", title:"내 검색어 — 자동차보험 갱신", body:"자동차보험 갱신 할인, 마일리지 특약 조건.", tags:"자동차보험 갱신 할인"}
  ];

  var NOW = new Date("2026-11-23T06:40:00+09:00");
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

  function stripParticle(t){
    var suffs = ["였어","이었어","인데","이고","라고","라는","이에요","예요","에서","에게","한테","으로","로서","부터","까지","보다","처럼","이나","하고","은","는","이","가","을","를","의","에","도","와","과","만","랑","나","로"];
    for(var k=0;k<2;k++){
      var done = true;
      for(var i=0;i<suffs.length;i++){
        var sf = suffs[i];
        if(t.length - sf.length >= 2 && t.slice(-sf.length) === sf){ t = t.slice(0, -sf.length); done = false; break; }
      }
      if(done) break;
    }
    return t;
  }

  function extractFragments(q){
    var raw = norm(q).split(" ").filter(Boolean);
    var frags = [], seen = {};
    var stop = {"그거":1,"있잖아":1,"혹시":1,"같은데":1,"봤는데":1,"인데":1,"얘기":1,"본":1,"때":1,"거":1,"좀":1,"것":1};
    raw.forEach(function(t0){
      var t = stripParticle(t0);
      if(!t) return;
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
    });
    // 더 긴 조각에 포함되는 짧은 조각은 버린다
    frags = frags.filter(function(f){
      return !frags.some(function(g){ return g !== f && g.length > f.length && g.indexOf(f) >= 0; });
    });
    return frags.slice(0,10);
  }

  var FIELD = {title:3.0, tags:2.0, body:1.0};
  var FIELD_LABEL = {title:"제목", tags:"태그", body:"본문"};

  var SYN = [["갈아타","갈아탄","대환","전환"],["한산","한적","조용"],["적정","적당","알맞"],["영하","마이너스"],["등산","산행"],["독감","인플루엔자"]];
  function synonyms(f){
    var out = [];
    SYN.forEach(function(g){
      if(g.some(function(x){ return f.indexOf(x)>=0 || x.indexOf(f)>=0; })){ out = out.concat(g); }
    });
    return out;
  }

  function fragScore(doc, frag){
    var f = norm(frag);
    if(!f) return {score:0, hit:null, how:""};
    var t = norm(doc.title), g = norm(doc.tags).replace(/ /g,""), b = norm(doc.body);
    var best = {score:0, hit:null, how:""};
    var forms = [f].concat(synonyms(f).filter(function(x){ return x !== f; }));
    [["title",t,FIELD.title],["tags",g,FIELD.tags],["body",b,FIELD.body]].forEach(function(x){
      forms.forEach(function(form){
        if(best.score >= x[2]) return;
        if(x[1].indexOf(form) >= 0 && form !== f){
          best = {score: x[2]*0.8, hit: x[0], how: "동의어 ‘"+form+"’"};
        }
      });
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
      var d = h.doc;
      var topScore = hits[0].score || 1;
      var rel = Math.round(h.score / topScore * 100);
      var why = h.m.details.slice(0,4).map(function(x){ return x.frag + " (" + (FIELD_LABEL[x.field]||"") + " " + x.how + ")"; }).join(" · ");
      return '<div class="item">'+
        '<div class="top"><span class="pill '+(d.src==="뉴스"?"p":d.src==="판"?"g":"n")+'">'+d.src+'</span>'+
        '<span>'+d.date+'</span><span>·</span><span>'+(d.who==="기사"?"기사·보도":"사람이 쓴 글")+'</span>'+
        '<span style="margin-left:auto" title="이 검색 안에서 1위 결과 대비 상대 점수">상대 적합도 '+rel+'%</span></div>'+
        '<h3>'+highlight(d.title, frags)+'</h3>'+
        '<div class="snip">'+highlight(d.body, frags)+'</div>'+
        '<div class="scorebar"><i style="width:'+Math.max(4,rel)+'%"></i></div>'+
        '<div class="whybox"><b>왜 이 결과인지</b> — '+escapeHtml(why || "시간 근접도만 반영")+
        (i===0?' · <b>최상위</b>':'')+'</div>'+
        '</div>';
    }).join("");
    if(top[0]) {
      $("results").setAttribute("aria-label", "검색 결과 " + top.length + "건");
    }
    logLine("검색 — " + q + " · 조각 " + frags.length + "개 · 결과 " + top.length + "건 (상위 1: " + top[0].doc.title + ")");
  }

  var logs = [];
  function logLine(s){
    logs.unshift(new Date().toTimeString().slice(0,8) + "  " + s);
    $("log").textContent = logs.slice(0,12).join("\n");
  }


  // ---------- v2: 품질 측정 (라벨된 질의 10건) ----------
  var GOLD = [
    {q:"겨울에 본 기사인데 전세 대출 금리가 3%대였어", id:1},
    {q:"아이 학교 독감 결석 얘기 봤는데", id:8},
    {q:"작년에 전세 갈아탄 사람 후기", id:13},
    {q:"전기요금 두 배 차이 난다는 글", id:4},
    {q:"주말에 등산 코스 추천해 주는 글", id:11},
    {q:"서울 버스 노선 바뀐다던 기사", id:22},
    {q:"세탁기 오래 쓰면 전기요금 얼마나 늘어", id:15},
    {q:"헬스장 아침에 한산하다던 쪽지", id:6},
    {q:"한파 영하 3도 기사", id:3},
    {q:"반도체 수출 늘었다는 뉴스", id:12}
  ];

  function keywordEngine(q){
    var toks = norm(q).split(" ").filter(function(t){ return t.length>=2; });
    var scored = DOCS.map(function(doc){
      var t = norm(doc.title), g = norm(doc.tags), b = norm(doc.body), sc = 0, hits = 0;
      toks.forEach(function(tok){
        if(t.indexOf(tok)>=0){ sc += FIELD.title; hits++; }
        else if(g.indexOf(tok.replace(/ /g,""))>=0){ sc += FIELD.tags; hits++; }
        else if(b.indexOf(tok)>=0){ sc += FIELD.body; hits++; }
      });
      return {doc:doc, sc:hits ? sc : 0};
    }).filter(function(x){ return x.sc>0; });
    scored.sort(function(a,b){ return b.sc-a.sc; });
    return scored.map(function(x){ return x.doc.id; });
  }

  function strictEngine(q){
    var toks = norm(q).split(" ").filter(function(t){ return t.length>=2; });
    var scored = DOCS.map(function(doc){
      var t = norm(doc.title), g = norm(doc.tags), b = norm(doc.body), all = t+" "+g+" "+b, sc = 0;
      var every = toks.every(function(tok){ return all.indexOf(tok)>=0; });
      if(!every) return {doc:doc, sc:0};
      toks.forEach(function(tok){
        if(t.indexOf(tok)>=0) sc += FIELD.title;
        else if(g.indexOf(tok)>=0) sc += FIELD.tags;
        else sc += FIELD.body;
      });
      return {doc:doc, sc:sc};
    }).filter(function(x){ return x.sc>0; });
    scored.sort(function(a,b){ return b.sc-a.sc; });
    return scored.map(function(x){ return x.doc.id; });
  }

  function fragmentEngine(q){
    var frags = extractFragments(q);
    var scored = DOCS.map(function(doc){
      var m = match(doc, frags);
      return {doc:doc, sc: m.norm};
    }).filter(function(x){ return x.sc>0; });
    scored.sort(function(a,b){ return b.sc-a.sc; });
    return scored.map(function(x){ return x.doc.id; });
  }

  if($("benchSummary")){
    var rows = GOLD.map(function(g){
      var k = keywordEngine(g.q), st = strictEngine(g.q), f = fragmentEngine(g.q);
      return {
        q:g.q,
        gold:g.id,
        k1:k[0], k3:k.slice(0,3).indexOf(g.id)>=0,
        s1:st[0], s3:st.slice(0,3).indexOf(g.id)>=0,
        f1:f[0], f3:f.slice(0,3).indexOf(g.id)>=0,
        khit: k[0]===g.id, shit: st[0]===g.id, fhit: f[0]===g.id
      };
    });
    var k1 = rows.filter(function(r){return r.khit;}).length;
    var k3 = rows.filter(function(r){return r.k3;}).length;
    var s1 = rows.filter(function(r){return r.shit;}).length;
    var s3 = rows.filter(function(r){return r.s3;}).length;
    var f1 = rows.filter(function(r){return r.fhit;}).length;
    var f3 = rows.filter(function(r){return r.f3;}).length;
    var n = rows.length;
    $("benchSummary").innerHTML =
      '<div class="kpi">'+
      '<div><b>조각 검색 hit@1 / hit@3</b><span>'+f1+'/'+n+' · '+f3+'/'+n+'</span></div>'+
      '<div><b>키워드(느슨·하나라도) hit@1 / hit@3</b><span>'+k1+'/'+n+' · '+k3+'/'+n+'</span></div>'+
      '<div><b>키워드(엄격·모두 일치) hit@1 / hit@3</b><span>'+s1+'/'+n+' · '+s3+'/'+n+'</span></div>'+
      '</div>';
    function title(id){ var d=DOCS.filter(function(x){return x.id===id;})[0]; return d ? d.title : "—"; }
    function cell(ok, id){
      var txt = ok ? "적중" : (id === undefined ? "결과 0건" : "실패 — " + escapeHtml(title(id)));
      return '<td style="color:'+(ok?"#0b6b3a":"#b3261e")+'">'+txt+'</td>';
    }
    $("benchTable").innerHTML = '<table><thead><tr><th>질의</th><th>정답 문서</th><th>키워드(느슨) 1위</th><th>키워드(엄격) 1위</th><th>조각 검색 1위</th></tr></thead><tbody>'+
      rows.map(function(r){
        return '<tr><td>'+escapeHtml(r.q)+'</td><td>'+escapeHtml(title(r.gold))+'</td>'+
          cell(r.khit, r.k1)+cell(r.shit, r.s1)+cell(r.fhit, r.f1)+'</tr>';
      }).join('')+'</tbody></table>';
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


  // ---------- v2: 규모 시험 (같은 질의, 자료만 늘림) ----------
  function mulberry(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var TOPIC = [
    {k:"전세", t:["전세대출 금리","전세보증금 반환","전세 사기 예방","전세 계약 갱신"], b:"은행과 보증기관 조건이 달라 실제 부담이 달라진다. 서류와 등기부등본 확인이 먼저다.", tags:"전세 대출 보증금 계약"},
    {k:"난방", t:["겨울 난방비","보일러 온도","전기히터 소비전력","단열 필름"], b:"같은 실내 온도라도 난방 방식과 사용 시간에 따라 요금 차이가 크다.", tags:"난방 전기요금 겨울 보일러"},
    {k:"등산", t:["주말 등산 코스","겨울 등산 준비물","관악산 초보 코스","북한산 사람 많은 길"], b:"초보는 2시간 안팎 코스가 낫고 방한 장갑과 아이젠을 챙긴다.", tags:"등산 코스 주말 초보"},
    {k:"반도체", t:["반도체 수출","메모리 가격","설비 투자 전망","소재 부품 업종"], b:"메모리 가격과 장비 발주가 함께 움직이며 수출액이 늘었다.", tags:"반도체 수출 메모리 투자"},
    {k:"독감", t:["아이 독감 유행","독감 예방접종","학교 결석 기준","독감 등교"], b:"환자가 두 주 새 늘었고 예방접종과 손 씻기가 여전히 가장 효과적이다.", tags:"독감 아이 학교 건강"},
    {k:"버스", t:["서울 버스 노선 개편","간선 지선 조정","출퇴근 배차","버스 정류장 변경"], b:"노선 18개가 조정되고 출퇴근 시간대 배차 간격도 바뀐다.", tags:"버스 노선 서울 개편"},
    {k:"헬스장", t:["동네 헬스장 후기","헬스장 아침 시간","3개월권 가격","기구 사용법"], b:"아침 7시가 한산하고 3개월권이 한 달씩 끊는 것보다 쌌다.", tags:"헬스장 후기 운동 아침"},
    {k:"세탁기", t:["노후 세탁기 전기요금","세탁기 소음","중고 세탁기 거래","대기전력"], b:"같은 사용량에도 효율 저하로 요금 차이가 났고 소음도 커졌다.", tags:"세탁기 전기요금 가전"},
    {k:"자동차보험", t:["자동차보험 갱신","다이렉트 비교","마일리지 특약","무사고 할인"], b:"갱신 시점과 특약 조건에 따라 보험료 차이가 크다.", tags:"자동차보험 갱신 할인 비교"}
  ];
  var PLACE = ["서울","부산","대구","인천","대전","광주","수원","성남","고양","청주"];
  var MONTH = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  function genDocs(n){
    var rnd = mulberry(20261123);
    var out = [];
    for(var i=0;i<n;i++){
      var tp = TOPIC[Math.floor(rnd()*TOPIC.length)];
      var tt = tp.t[Math.floor(rnd()*tp.t.length)];
      var pl = PLACE[Math.floor(rnd()*PLACE.length)];
      var mo = MONTH[Math.floor(rnd()*MONTH.length)];
      var num = 1 + Math.floor(rnd()*9);
      var src = rnd() < 0.5 ? "뉴스" : "판";
      out.push({
        id: 1000+i,
        date: "2026-" + String(1+Math.floor(rnd()*11)).padStart(2,"0") + "-" + String(1+Math.floor(rnd()*27)).padStart(2,"0"),
        src: src,
        who: src === "뉴스" ? "기사" : "사람",
        title: pl + " " + tt + " 정리 " + num,
        body: mo + " 기준으로 " + tp.b + " " + pl + " 기준 사례 " + num + "건을 더 봤다.",
        tags: tp.tags + " " + pl
      });
    }
    return out;
  }

  function runScale(){
    var before = DOCS.length;
    var added = genDocs(270);
    Array.prototype.push.apply(DOCS, added);
    var t0 = performance.now();
    var rows = GOLD.map(function(g){
      var k = keywordEngine(g.q), f = fragmentEngine(g.q);
      return { gold:g.id,
        khit: k[0]===g.id, k3: k.slice(0,3).indexOf(g.id)>=0,
        fhit: f[0]===g.id, f3: f.slice(0,3).indexOf(g.id)>=0,
        k0: k.length===0, f0: f.length===0 };
    });
    var elapsed = performance.now() - t0;
    var n = rows.length;
    var k1 = rows.filter(function(r){return r.khit;}).length;
    var k3 = rows.filter(function(r){return r.k3;}).length;
    var f1 = rows.filter(function(r){return r.fhit;}).length;
    var f3 = rows.filter(function(r){return r.f3;}).length;
    var f0 = rows.filter(function(r){return r.f0;}).length;
    var k0 = rows.filter(function(r){return r.k0;}).length;
    $("corpusCount").textContent = String(DOCS.length);
    $("scaleOut").innerHTML =
      '<div class="kpi">' +
      '<div><b>자료 ' + DOCS.length + '건에서 조각 검색</b><span>hit@1 ' + f1 + '/' + n + ' · hit@3 ' + f3 + '/' + n + ' · 0건 ' + f0 + '</span></div>' +
      '<div><b>같은 자료에서 키워드(느슨)</b><span>hit@1 ' + k1 + '/' + n + ' · hit@3 ' + k3 + '/' + n + ' · 0건 ' + k0 + '</span></div>' +
      '<div><b>질의 10건 두 방식 합계 시간</b><span>' + Math.round(elapsed) + 'ms (' + Math.round(elapsed/ (n*2)) + 'ms/질의)</span></div>' +
      '<div><b>늘어난 자료</b><span>' + (DOCS.length - before) + '건, 제가 만든 것</span></div>' +
      '</div>' +
      '<p class="tiny muted" style="margin-top:8px">정답 문서는 늘어난 자료에도 그대로 있고, 늘어난 자료는 같은 주제의 다른 문서입니다. 실제 서비스 색인이 아니라 정답을 흔들어 보는 시험입니다.</p>';
  }
  if($("scaleRun")){
    $("scaleRun").addEventListener("click", runScale);
  }

  var tabs = [["t1","p1"],["t2","p2"],["t3","p3"],["t4","p4"],["t5","p5"],["t6","p6"]];
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
