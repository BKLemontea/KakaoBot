const scriptName="알림.js";

const MEMBER_FILENAME = "alarm_member"
const QUASAR_FILENAME = "quasar";
const VER = "1.0";
const QUASAR_URL = "https://quasarzone.co.kr/bbs/board.php?bo_table=qb_saleinfo";
const MANAGER = [
    "김재윤"
];

const SEC = 60;
const TIMER = 1000 * SEC;
var MemberList;
var FIRST = true;
var lastQuasar;

// 명령어
const SC = '/';
const WORD = SC + "알림 ";

const CREATE_MEMBER = WORD + "받기";
const DELETE_MEMBER = WORD + "취소";
const SHOW_MEMBER = WORD + "리스트";
// 명령어

// 도움말
const HELP = "[조깅-개인] ver. " + VER + "\n" +
            "--------------------------\n" +
            CREATE_MEMBER + "\n" + 
            DELETE_MEMBER + "\n" +
            SHOW_MEMBER;
// 도움말

// setInterval
var timer = new java.util.Timer();
var counter = 1;
var ids = {};
setTimeout = function (fn, delay) {
    var id = counter++;
    ids[id] = new JavaAdapter(java.util.TimerTask, {
       run: fn
    });
    timer.schedule(ids[id], delay);
    return id;
 }
 
 clearTimeout = function (id) {
    ids[id].cancel();
    timer.purge();
    delete ids[id];
 }
 
 setInterval = function (fn, delay) {
    var id = counter++;
    ids[id] = new JavaAdapter(java.util.TimerTask, {
       run: fn
    });
    timer.schedule(ids[id], delay, delay);
    return id;
 }
 
 clearInterval = clearTimeout;
// setInterval

// Member
function createMember(replier, username){
    for(var member of MemberList){
        if(member.name === username){
            replier.reply("이미 가입된 상태입니다.");
            return 0;
        }
    }
    MemberList.push({
        name: username,
        join: false
    });
    saveMember();
    replier.reply("[" + username + "]님의 알림 받기를 완료하였습니다.");
    return 0;
}

function deleteMember(replier, username){
    for(var i in MemberList){
        if(MemberList[i].name === username){
            MemberList.splice(i,1);
            saveMember();
            replier.reply("[" + username + "]님의 알림 취소를 완료했습니다.");
            return 0;
        }
    }
    replier.reply("구독자 목록에 없습니다.");
    return 0;
}

function saveMember(){
    try{
        let memberStr = "";
        for(var member of MemberList){
            memberStr += member.name + "\n";
        }
        DataBase.setDataBase(MEMBER_FILENAME, memberStr.slice(0, -1));
        return "Member Save Success";
    }catch(e){
        return "Member Save Error";
    }
}

function loadMember(){
    MemberList = new Array();
    try{
        let loadMemberDate = DataBase.getDataBase(MEMBER_FILENAME);
        let MemberDate = loadMemberDate.split("\n");
        for(var member of MemberDate){
            MemberList.push({
                name: member
            });
        }
        return "Member Load Success";
    }catch(e){
        return "Member Load Error";
    }
}

function showMember(){
    let memberStr = "[구독자 리스트]\n--------------------------\n";
    for(var member of MemberList){
        memberStr += member.name + "\n";
    }
    return memberStr.slice(0, -1);
}
// Member

// Manager
function checkManager(username){
    for(var man of MANAGER){
        if(man === username){
            return true;
        }
    }
    return false;
}
// Manager

// DataBase
function saveDataBase(filename, Data){
    try{
        DataBase.setDataBase(filename, Data);
        return "Save Success";
    }catch(e){
        return "Save Error";
    }
}

function loadDataBase(filename){
    try{
        return DataBase.getDataBase(filename);
    }catch(e){
        return "Load Error";
    }
}
// DataBase

// Quasar
function quasarHTML(){
    try{
        let html = org.jsoup.Jsoup.connect(QUASAR_URL).get().select("li.list-item");
        let item;
        let i = 0;
        while(true){
            item = html.get(i);
            if(item.attr("class").indexOf("bg-black") === -1 ){
                break;
            }
            i++;
        }

        let titleTemp = String(item.select("a.item-subject").text());
        let views = String(item.select("span.wr-comment").text()); // 조회수 삭제
        if(views !== ""){
            titleTemp = titleTemp.substring(views.length + 1);
        }

        let parsingData = {
            updated: String(item.select("div.wr-date").text()),
            title: titleTemp,
            hlink: String(item.select("a.item-subject").attr("href"))
        };
    
        return parsingData;
    }catch(e){
        return e;
    }
}

function updateQuasar(replier, test){
    let QuasarData = quasarHTML();
    if(QuasarData.hlink !== lastQuasar || test === true){
        lastQuasar = QuasarData.hlink;
        saveDataBase(QUASAR_FILENAME, lastQuasar);
        sendMsg(replier, QuasarData);
    }

    return 0;
}
// Quasar

// All User Send Message
function sendMsg(replier, Data){
    let Msg = "업데이트 일자 : " + Data.updated + "\n" + Data.title + "\n" + Data.hlink;
    for(var mem of MemberList){
        replier.reply(mem.name, Msg);
    }

    return 0;
}
// All User Send Message

// Auto Update
function interval(replier) {
    ALARM_QUASAR = setInterval(function(){
        updateQuasar(replier, false);
    }, TIMER);
 }
 // Auto Update

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
    if(FIRST === true){
        FIRST = false;
        init();
        interval(replier);
    }

    // 관리자
    if(checkManager(sender) === true){
        if(msg === "/알림 관리자 명령어"){
            let managerCommendMsg = "[관리자 명령어]\n--------------------------\n/알림 테스트\n/알림 정보\n/알림 초기화\n/알림 종료";
            replier.reply(managerCommendMsg);
        }else if(msg === "/알림 테스트"){
            replier.reply("테스트 중");
            let parsingData = quasarHTML();
            updateQuasar(replier, true);
        }else if(msg === "/알림 정보"){
            let info = "최근 링크 : " + lastQuasar;
            replier.reply(info);
        }else if(msg === "/알림 초기화"){
            DataBase.removeDataBase(MEMBER_FILENAME);
            replier.reply(loadMember());
        }else if(msg === "/알림 종료"){
            try{
                clearInterval(ALARM_QUASAR);
                replier.reply("정상 종료");
            }catch(e){
                replier.reply(e);
            }     
        }
    }
    // 관리자

    // 일반 사용자
    if(isGroupChat === false){
        if(msg === WORD.replace(" ", "")){
            replier.reply(HELP);
        }
        else if(msg === CREATE_MEMBER){
            createMember(replier, sender);
        }
        else if(msg === DELETE_MEMBER){
            deleteMember(replier, sender);
        }if(msg === SHOW_MEMBER){
            replier.reply(showMember());
        }
    }
    // 일반 사용자
}

function init(){
    MemberList = new Array();
    lastQuasar = loadDataBase(QUASAR_FILENAME);
    loadMember();
}

function onStartCompile(){}
function onCreate(savedInstanceState,activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}