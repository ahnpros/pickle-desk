(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var log = [];
  var saved = {};

  var NOTES = [
    {
      id:"n1", from:"서연", initial:"서", time:"오늘 14:20",
      rel:{label:"이웃 3개월 · 주고받은 쪽지 5건", tone:"g"},
      why:{text:"내 판 댓글에 답장 · 3일 전", tone:"g"},
      preview:"혹시 자곡동 헬스장 얘기하신 분이죠? 저도 같은 곳 다니는데…",
      body:"혹시 자곡동 헬스장 얘기하신 분이죠? 저도 같은 곳 다니는데 시간대가 겹치는 것 같아서요. 내일 아침에도 가시나요?",
      chain:[
        {t:"11/18", b:"내 댓글", s:"‘동네 헬스장 3개월 다닌 후기’ 글에 “저도 자곡동인데 시간대 궁금해요”"},
        {t:"11/19", b:"서연 님의 글", s:"같은 글에 답글 “아침 7시가 한산해요”"},
        {t:"오늘 14:20", b:"이 쪽지", s:"그 답글에서 이어서 보냄", last:true}
      ],
      first:false
    },
    {
      id:"n2", from:"판돌이", initial:"판", time:"어제 21:02",
      rel:{label:"이웃의 이웃 · 이웃 0일", tone:"b"},
      why:{text:"이웃의 이웃 · 어제", tone:"b"},
      preview:"안녕하세요, 이웃으로 보고 인사드려요. 중고 거래 관련해서…",
      body:"안녕하세요, 이웃으로 보고 인사드려요. 중고 거래 관련해서 여쭤볼 게 있어서 쪽지 드렸어요. 혹시 아직 거래하실 의향 있으실까요?",
      chain:[
        {t:"어제 20:55", b:"내 이웃 ‘도윤’ 님의 이웃 목록", s:"공개된 이웃 목록에서 찾음"},
        {t:"어제 21:02", b:"이 쪽지", s:"경로: 이웃의 이웃", last:true}
      ],
      first:true
    },
    {
      id:"n3", from:"자곡러", initial:"자", time:"오늘 09:41",
      rel:{label:"처음 보는 사람 · 이웃 아님", tone:"n"},
      why:{text:"내 전체 공개 글을 보고 · 오늘", tone:"b"},
      preview:"글 잘 봤습니다. 저도 등록하려는데 3개월권 얼마였는지…",
      body:"글 잘 봤습니다. 저도 등록하려는데 3개월권 얼마였는지 여쭤봐도 될까요?",
      chain:[
        {t:"11/21", b:"내 전체 공개 글", s:"‘동네 헬스장 3개월 다닌 후기’ — 판에 전체 공개로 올린 글"},
        {t:"오늘 09:41", b:"이 쪽지", s:"그 글에서 쪽지 보내기", last:true}
      ],
      first:true
    },
    {
      id:"n4", from:"이벤트안내", initial:"이", time:"오늘 07:12",
      rel:{label:"처음 보는 사람 · 최근 7일 같은 발신자 3건", tone:"a"},
      why:{text:"왜 왔는지 확인할 수 없어요 · 오늘", tone:"a"},
      preview:"회원님께 특별 혜택을 드립니다. 아래 링크에서 확인해 주세요…",
      body:"안녕하세요! 회원님께 특별 혜택을 드립니다. 아래 링크에서 확인해 주세요. [링크] event-2026…(접힘)",
      chain:[
        {t:"—", b:"경로 기록 없음", s:"발신자가 글·댓글·이웃을 거치지 않고 보냄. 서비스가 경로를 남기지 않은 경우도 있어 단정하지 않음"},
        {t:"오늘 07:12", b:"이 쪽지", s:"본문에 외부 링크 포함 · 링크는 자동으로 열리지 않음", last:true}
      ],
      first:true, risky:true
    }
  ];

  function clock(){ return new Date().toTimeString().slice(0,8); }
  function addLog(text, detail){
    log.push("· " + clock() + "  " + text + (detail ? "  — " + detail : ""));
    $("log").textContent = log.length ? log.join("\n") : "(아직 아무 동작 없음)";
    $("stepCount").textContent = String(log.length);
    $("log").scrollTop = $("log").scrollHeight;
  }
  var toastTimer = null;
  function toast(msg, undo){
    var t = $("toast");
    t.innerHTML = msg + (undo ? ' <button class="btn sm" id="undoBtn" style="margin-left:8px">되돌리기</button>' : "");
    t.classList.add("on");
    if(undo){ $("undoBtn").addEventListener("click", undo); }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove("on"); }, 6000);
  }

  function whyMark(tone){
    var colors = {g:"#0b6b3a", b:"#14509e", a:"#b45309", r:"#b3261e"};
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7" stroke="'+colors[tone]+'" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function render(){
    var list = $("list");
    list.innerHTML = NOTES.map(function(n){
      var open = !!saved[n.id];
      var html = '<div class="note '+(open?"open":"")+'" id="note-'+n.id+'">';
      html += '<button class="note-h" aria-expanded="'+open+'" aria-controls="body-'+n.id+'" aria-label="'+n.from+', '+n.time+', 왜 왔는지: '+n.why.text+'">';
      html += '<span class="av" aria-hidden="true">'+n.initial+'</span>';
      html += '<span style="flex:1">';
      html += '<span class="nm">'+n.from+(n.first?' <span class="pill '+n.rel.tone+'">첫 쪽지</span>':'')+'</span>';
      html += '<span class="tm">'+n.time+'</span>';
      html += '<span class="pv">'+n.preview+'</span>';
      html += '<span class="why '+n.why.tone+'">'+whyMark(n.why.tone)+n.why.text+'</span>';
      html += '</span></button>';
      html += '<div class="body" id="body-'+n.id+'" '+(open?"":"hidden")+'>';
      html += '<p style="font-size:13.5px;margin:10px 0 0">'+n.body+'</p>';
      if(n.risky){
        html += '<div class="warnbox"><b>링크가 든 쪽지예요.</b> 누르기 전에 주소를 확인하세요. 이 쪽지는 경로가 남아 있지 않아 <b>왜 왔는지 확인할 수 없습니다</b>. 같은 발신자에게서 최근 7일간 3건이 왔어요.</div>';
      }
      html += '<ul class="chain" aria-label="왜 왔는지 경로">';
      n.chain.forEach(function(c){
        html += '<li'+(c.last?' class="last"':'')+'><span class="dot2" aria-hidden="true"></span><span><b>'+c.b+'</b> <span class="src">'+c.t+'</span><br><span class="src">'+c.s+'</span></span></li>';
      });
      html += '</ul>';
      html += '<div class="evid"><b>관계 근거</b> — '+n.rel.label+'<br><span class="muted">숫자는 이 쪽지함에서 실제로 셀 수 있는 값만 씁니다. 점수·등급은 만들지 않아요.</span></div>';
      html += '<div class="acts">';
      html += '<button class="btn pri" data-act="reply" data-id="'+n.id+'">답장</button>';
      if(n.first && !n.risky) html += '<button class="btn" data-act="neighbor" data-id="'+n.id+'">이웃 맺기</button>';
      html += '<button class="btn" data-act="why" data-id="'+n.id+'">왜 왔는지 더 보기</button>';
      html += '<button class="btn danger" data-act="block" data-id="'+n.id+'">차단</button>';
      html += '<button class="btn danger" data-act="report" data-id="'+n.id+'">신고</button>';
      html += '</div>';
      html += '<div class="report" id="rep-'+n.id+'" hidden><div class="tiny" style="font-weight:800">신고 이유를 하나 골라 주세요</div><div class="rr">';
      ["광고·홍보","모르는 사람의 반복 발송","욕설·괴롭힘","사칭·사기 의심"].forEach(function(r){
        html += '<button class="btn sm" data-reason="'+r+'" data-id="'+n.id+'">'+r+'</button>';
      });
      html += '</div><div class="tiny muted" style="margin-top:6px">신고는 접수만 되고, 제재는 별도 심사로 정해져요. 신고하면 이 발신자의 쪽지는 다시 받지 않습니다.</div></div>';
      html += '</div></div>';
      return html;
    }).join("");
    bind();
  }

  function bind(){
    Array.prototype.forEach.call(document.querySelectorAll(".note-h"), function(btn){
      btn.addEventListener("click", function(){
        var note = btn.closest(".note");
        var id = note.id.replace("note-","");
        var body = document.getElementById("body-"+id);
        var willOpen = body.hidden;
        body.hidden = !willOpen;
        note.classList.toggle("open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
        if(willOpen){
          var n = NOTES.filter(function(x){return x.id===id;})[0];
          addLog("쪽지 열기 — "+n.from, "경로를 먼저 봄: " + n.why.text);
          saved[id] = true;
        }
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-act]"), function(b){
      b.addEventListener("click", function(ev){
        ev.stopPropagation();
        var id = b.getAttribute("data-id"), act = b.getAttribute("data-act");
        var n = NOTES.filter(function(x){return x.id===id;})[0];
        if(act==="reply"){ addLog("답장 쓰기 — "+n.from); toast("답장 화면으로 이동했어요 (프로토타입)"); }
        if(act==="neighbor"){
          addLog("이웃 맺기 제안 — "+n.from);
          toast("이웃 맺기를 제안했어요. 상대가 수락하면 이웃 공개 범위가 열려요.", function(){ addLog("이웃 맺기 취소", "되돌리기"); toast("되돌렸어요"); });
        }
        if(act==="why"){ addLog("경로 사슬 다시 읽기 — "+n.from, n.why.text); toast("경로: " + n.why.text + " · 근거: " + n.rel.label); }
        if(act==="block"){
          addLog("차단 — "+n.from, "30초 안에 되돌릴 수 있음");
          toast("차단했어요. 이 사람의 쪽지는 다시 오지 않아요.", function(){ addLog("차단 취소", "되돌리기"); toast("차단을 되돌렸어요"); });
        }
        if(act==="report"){
          var rep = document.getElementById("rep-"+id);
          rep.hidden = !rep.hidden;
          addLog("신고 이유 고르기 — "+n.from);
          if(!rep.hidden) rep.querySelector("button").focus();
        }
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-reason]"), function(b){
      b.addEventListener("click", function(ev){
        ev.stopPropagation();
        var id = b.getAttribute("data-id"), reason = b.getAttribute("data-reason");
        var n = NOTES.filter(function(x){return x.id===id;})[0];
        document.getElementById("rep-"+id).hidden = true;
        addLog("신고 접수 — "+n.from, "이유: "+reason+" · 차단 동시 적용");
        toast("신고를 접수했어요 ("+reason+"). 이 발신자의 쪽지는 다시 받지 않습니다.", function(){ addLog("신고·차단 취소", "되돌리기"); toast("되돌렸어요"); });
      });
    });
  }

  $("btnSR").addEventListener("click", function(){
    var box = $("srBox");
    box.hidden = !box.hidden;
    if(!box.hidden){
      box.innerHTML = '<b>목록 한 줄이 읽히는 문장</b><br>' +
        '“보낸 사람 이벤트안내, 오늘 07시 12분, 왜 왔는지: 왜 왔는지 확인할 수 없어요, 본문 일부: 회원님께 특별 혜택을…, 안 읽음. 쪽지 열기.”<br><br>' +
        '<b>경로 사슬 읽기</b><br>“경로 1. 경로 기록 없음. 발신자가 글·댓글·이웃을 거치지 않고 보냄. 경로 2. 오늘 07시 12분, 이 쪽지, 본문에 외부 링크 포함.”';
      addLog("화면 낭독기 문장 확인");
    }
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

  render();
})();
