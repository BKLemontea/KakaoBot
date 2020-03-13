const scriptName="조깅.js";

const MEMBER_FILENAME = "MemberList";
const ROOM = "렛츠 조깅!";
const VER = "1.1";
const LOCATION = "삼안동";
const URL = "https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=" + LOCATION + "+날씨";
const MANAGER = [
    "김재윤"
];

const HOUR = 7; // 알림 시간
const MINUTE = 0; // 알림 분
const OVER_MINUTE = 30; //마감 분
var FIRST = true;
var ALARMTIME = true;
var TIMEOVER = true;

var time;
var alarm;
var MemberList;

// 명령어
const SC = '/';
const WORD = SC +"조깅 ";

const CREATE_MEMBER = WORD + "가입";
const DELETE_MEMBER = WORD + "탈퇴";
const SHOW_MEMBER = WORD + "리스트";

const JOIN = SC + "참가";
const CANCEL = SC + "취소";
const WEATHER = SC + "날씨";
// 명령어

// 도움말
const INDIVIDUALHELP = "[조깅-개인] ver. " + VER + "\n" +
            "--------------------------\n" +
            CREATE_MEMBER + "\n" + 
            DELETE_MEMBER + "\n" +
            SHOW_MEMBER + "\n" +
            JOIN + "\n" +
            CANCEL + "\n" +
            WEATHER;

const GROUPHELP = "[조깅-단체] ver. " + VER + "\n" +
            "--------------------------\n" +
            SHOW_MEMBER + "\n" +
            WEATHER;
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
    replier.reply(ROOM, "[" + username + "]님이 가입하셨습니다.");
    replier.reply("[" + username + "]님의 가입신청을 완료하였습니다.");
    return 0;
}

function deleteMember(replier, username){
    for(var i in MemberList){
        if(MemberList[i].name === username){
            MemberList.splice(i,1);
            saveMember();
            replier.reply(ROOM, "[" + username + "]님이 탈주하셨습니다.");
            replier.reply("[" + username + "]님의 탈퇴신청을 완료했습니다.");
            return 0;
        }
    }
    replier.reply("참여부터 하시죠?");
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
                name: member,
                join: false
            });
        }
        return "Member Load Success";
    }catch(e){
        return "Member Load Error";
    }
}

function showMember(){
    let memberStr = "[멤버 리스트]\n--------------------------\n";
    for(var member of MemberList){
        memberStr += member.name + " : ";
        if(member.join == true){
            memberStr += "참가" + "\n";
        }else{
            memberStr += "불참" + "\n";
        }
    }
    return memberStr.slice(0, -1);
}

function join(username){
    for(var member of MemberList){
        if(member.name === username){
            if(member.join === false){
                member.join = true;
                return "참가 신청을 완료했습니다.";
            }else{
                return "이미 참가 신청을 완료했습니다."
            }
        }
    }
    return "가입자 정보를 찾을 수 없습니다.";
}

function cancel(username){
    for(var member of MemberList){
        if(member.name === username){
            if(member.join === true){
                member.join = false;
                return "참가 신청을 취소했습니다.";
            }else{
                return "참가 상태가 아닙니다."
            }
        }
    }
    return "가입자 정보를 찾을 수 없습니다.";
}

function checkManager(username){
    for(var man of MANAGER){
        if(man === username){
            return true;
        }
    }
    return false;
}

function weather(){
    try{
        let html = org.jsoup.Jsoup.connect(URL).get().select("div.main_info").get(0);
        let temperature = html.select("span.todaytemp").text() + "℃";
        let infoList = html.select("ul.info_list");
        let detailInfo = infoList.select("p.cast_txt").text();
        let minTemp = infoList.select("span.min").text();
        let maxTemp = infoList.select("span.max").text();
        let sensoryTemp = infoList.select("span.sensible").select("em").text();

        let tempMsg = "[" + LOCATION + " 날씨 정보]\n" +
                        "현재 기온 : " + temperature + "\n" +
                        detailInfo + "\n" +
                        minTemp + "/" + maxTemp + " | 체감온도 " + sensoryTemp;
        return tempMsg;
    }catch(e){
        return "error";
    }
}

function interval(replier) {
    alarm = setInterval(function () {
        let time_y = new Date();

        if(time.getDate() != time_y.getDate()){
            init();
            loadMember();
            replier.reply("김재윤", "초기화 합니다.");
        }

        time = time_y;

        if(time.getHours() == HOUR && time.getMinutes() == MINUTE && ALARMTIME == true){
            ALARMTIME = false;
            TIMEOVER = false;
            let sendMsg = weather();
            for(var member of MemberList){
                if(sendMsg !== "error"){
                    replier.reply(member.name, sendMsg);
                }
                replier.reply(member.name, "오늘 조깅 오십니까?\n참가하시면 [" + JOIN + "]를 입력해주세요.");
            }
        }

        if(time.getHours() == HOUR && time.getMinutes() > OVER_MINUTE && TIMEOVER == false){
            TIMEOVER = true;
            replier.reply(ROOM, showMember());
        }
    }, 1000);
 }

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
    if(FIRST === true){
        FIRST = false;
        init();
        loadMember();
        interval(replier);
    }

    // 관리자
    if(checkManager(sender) === true){
        if(msg === "/관리자 명령어"){
            let managerCommendMsg = "[관리자 명령어]\n--------------------------\n/조깅 종료\n/멤버 초기화\n/조깅 정보\n/공지 [메시지]";
            replier.reply(managerCommendMsg);
        }else if(msg === "/조깅 종료"){
            try{
                clearInterval(alarm);
                replier.reply("정상 종료");
            }catch(e){
                replier.reply(e);
            }
        }else if(msg === "/멤버 초기화"){
            DataBase.removeDataBase(MEMBER_FILENAME);
            replier.reply(loadMember());
        }else if(msg === "/조깅 정보"){
            let infoMsg = "[정보]\n" +
                            "알람 시간 : " + HOUR + ":" + MINUTE + "\n" +
                            "마감 시간 : " + HOUR + ":" + OVER_MINUTE + "\n" +
                            "알람 가능 여부 : " + ALARMTIME + "\n" +
                            "시간 만료 여부 : " + TIMEOVER;
            replier.reply(infoMsg);
        }else if(msg.indexOf("/공지") !== -1){
            let sendMsg = msg.replace("/공지",'');
            sendMsg = sendMsg.trim();
            for(var member of MemberList){
                replier.reply(member.name, sendMsg);
            }
        }
    }
    // 관리자

    // 공통 사항
    if(msg === SHOW_MEMBER){
        replier.reply(showMember());
    }else if(msg === WEATHER){
        replier.reply(weather());
    }
    // 공통 사항

    // 개인
    if(isGroupChat === false){
        if(msg === WORD.replace(" ", "")){
            replier.reply(INDIVIDUALHELP);
        }
        else if(msg === CREATE_MEMBER){
            createMember(replier, sender);
        }
        else if(msg === DELETE_MEMBER){
            deleteMember(replier, sender);
        }
        else if(msg === JOIN || msg === CANCEL){
            if(ALARMTIME == false && TIMEOVER == false){
                if(msg === JOIN){
                    replier.reply(join(sender));
                }else{
                    replier.reply(cancel(sender));
                }
            }else if(ALARMTIME == true){
                replier.reply("참가 신청서가 도착하기 않았습니다.");
            }else{
                replier.reply("마감되었습니다.");
            }
        }
    }
    // 개인

    // 단체
    else if(room === ROOM){
        if(msg === WORD.replace(" ", "")){
            replier.reply(ROOM, GROUPHELP);
        }
    }
    // 단체
}

function init(){
    MemberList = new Array();
    time = new Date();

    if( (time.getHours() == HOUR && time.getMinutes() > OVER_MINUTE) ||  time.getHours() > HOUR ){
        ALARMTIME = false;
    }else{
        ALARMTIME = true;
    }
    TIMEOVER = true;
}

function onStartCompile(){
}
function onCreate(savedInstanceState,activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}