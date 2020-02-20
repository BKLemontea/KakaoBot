const scriptName="Nico.js";
const ROOMS = "PNN 공부합시다"; //방 이름
const VER = "ver 1.3.1"; // 버전
const TIME = 60 * 5; //알람 주기
var ROOM2;
var REPLIER2;
const MANAGER = "김재윤";

// 파일 저장 & 읽기
const SDCARD = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/katalkbot/lib/"; //절대 경로
const FILENAME = "Nico_reservations.txt";

// 명령어
const SC = "/";
const NICO = SC + "니꼬 ";

const HELP = NICO + "도움말";

const RESERVATION_NOW = NICO + "납치";
const RESERVATION = NICO + "예약";

const LOGIN = NICO + "로그인";
const LOGOUT = NICO + "로그아웃";

const CANCEL = NICO + "예약취소";
const CANCEL_ALL = NICO + "모든예약취소";

const LIST = NICO + "리스트";

const EXIT = NICO + "종료";
const RESTART =  NICO + "재시작";

var currentDay; // 현재 날짜
var currentHour; // 현재 시간
var currentLoginUser; // 현재 사용중인 유저
var reservationUser; // 예약되어있는 유저
var reservations; // 예약 리스트
var flag = true; // 최초 실행 여부 확인용
var count = 0;

var startTimer;

var setTimeout,
    clearTimeout,
    setInterval,
    clearInterval;

    var timer = new java.util.Timer();
    var counter = 1; 
    var ids = {};

    setTimeout = function (fn,delay) {
        var id = counter++;
        ids[id] = new JavaAdapter(java.util.TimerTask,{run: fn});
        timer.schedule(ids[id],delay);
        return id;
    }

    clearTimeout = function (id) {
        ids[id].cancel();
        timer.purge();
        delete ids[id];
    }

    setInterval = function (fn,delay) {
        var id = counter++; 
        ids[id] = new JavaAdapter(java.util.TimerTask,{run: fn});
        timer.schedule(ids[id],delay,delay);
        return id;
    }

    clearInterval = clearTimeout;

// 구조체
function reservations_f() {
   var name;
   var status; // 0은 사용전, 1은 사용중, 2는 사용완료, 3은 마감
}

// 사용
function useNico(sender){
    var fl = false;
    for(var i in reservations){
        if(reservations[i].name === sender && i >= currentHour && reservations[i].status === 0 && reservationUser === sender && (currentLoginUser === "None" || currentLoginUser === sender)){
            reservations[i].status = 1; // 사용중
            fl = true;
        }else if(fl === true && reservations[i].name !== sender) break;
    }
    if(fl === true){
       currentLoginUser = sender;
       return "[" + sender + "]님이 로그인했습니다.";
    }else{
       return "로그인 실패";
    } 
 }

// 사용완료
function stopNico(sender){
   if(currentLoginUser === sender){
      for(var i in reservations){
         if(reservations[i].name === sender && reservations[i].status === 1){
            if(i < currentHour){
              reservations[i].status = 2; // 사용완료
            }else{
              cancelReservation(sender, i, true);
            }
         }
      }
      currentLoginUser = "None";
      return "[" + sender + "]님이 로그아웃했습니다.";
   }else{
       return "[" + sender + "]님은 로그인 상태가 아닙니다.";
    } 
 }

// 시간 만료
function timeOut(time){
    for(var i in reservations){
       if(reservations[i].status === 0 && i < time){
        reservations[i].status = 3;
       }
    }
 }
 
 // 파일 저장
 function save(path, filename, content){
    try{
        var folder = new java.io.File(path);
        folder.mkdirs();
        var file = new java.io.File(path+filename);
        var fos = new java.io.FileOutputStream(file);
        var contentstring = "";
        for(var i in content){
            contentstring += reservations[i].name + "|" + reservations[i].status + "\n";
        }
        contentstring = new java.lang.String(contentstring.slice(0,-1));
        fos.write(contentstring.getBytes());
        fos.close();
    }catch(e){
       return e;
    }
    return true;
 }
 
 // 파일 읽기
 function read(path, filename){
     var file = new java.io.File(path+filename);
     if(file.exists() == false) return null;
     try{
        var fis = new java.io.FileInputStream(file);
        var isr = new java.io.InputStreamReader(fis);
        var br = new java.io.BufferedReader(isr);
        var temp_br = "";
        var temp_readline = "";
        while(true){
            if((temp_readline = br.readLine()) === null) break;
            temp_br += temp_readline + "\n";
        }
        temp_br = temp_br.slice(0,-1);
  
         var temp_reserv = temp_br.split("\n");
         for(var i=0; i<24; i++){
            reservations[i].name = temp_reserv[i].split("|")[0];
            reservations[i].status = parseInt(temp_reserv[i].split("|")[1]);
         }
        try{
           fis.close();
           isr.close();
           br.close();
           return true;
        }catch(e){
           return e;
        }
     }catch(e){
        return e;
     }
  }

// 중복 시간 확인
function checkOverlap(m){
    if(reservations[m].name !== "None"){
        return true;
    }
    return false;
 }

 // 예약
function reserv(sender, start, end) {
    if( (start>=0 && start <24) && (end >=0 && end < 24) && start <= end ) {
       for(var i=start; i<=end; i++) {
          if( i < currentHour){
             if(start === end){
                return "예약이 마감된 시간입니다."; 
             }else{
                return "예약이 마감된 시간을 포함하고 있습니다."; 
             }
          }
          if(checkOverlap(i) === true){ 
             if(start === end){
                return "이미 예약이 완료된 시간입니다."; 
             }else{
                return "이미 예약이 완료된 시간을 포함하고 있습니다."; 
             }
          }
       }
       for(var i=start; i<=end; i++){
          reservations[i].name = sender;
          if(reservations[i-1].name === sender && reservations[i-1].status === 1){
            reservations[i].status = 1;
          }
       }

       if(start === currentHour|| (reservations[start-1].name === sender && reservations[start-1].status === 1) ){
         reservationUser = reservations[currentHour].name;
         if(reservationUser === sender){
            useNico(sender);
         }
      }
       if(start === end){
          return "[" + sender + "]님께서 " + start + "시에 예약하셨습니다.";
       }else{
          return "[" + sender + "]님께서 " + start + "시부터 " + end + "시까지 예약하셨습니다.";
       }
    } else {
       return "정확한 형식으로 입력해주세요.";
    }
 }

 // 예약 취소
function cancelReservation(sender, time, is){
   if(reservations[time].name === sender){ 
      if(reservations[time].status !== 1 || is === true){
         reservations[time] = new reservations_f();
         reservations[time].name = "None";
         reservations[time].status = 0;
         return time + "시에 예약되어있던 [" + sender + "]님의 예약을 취소하였습니다.";
      }else{
         return "로그아웃부터 해주시기 바랍니다.";
      }
   }
   return "일치하는 정보가 없습니다.";
 }

 // 모든 예약 취소
function cancelReservationAll(sender) {
    var cancelReservAll = false;
    for(var i in reservations){
        if(reservations[i].name === sender){
            reservations[i] = new reservations_f();
            reservations[i].name = "None";
            reservations[i].status = 0;
            cancelReservAll = true;
        }
    }
    return cancelReservAll;
 }

 // 예약 리스트 보여주기
function reservationList() {
    var str = "[예약 리스트] " + (parseInt(new Date().getMonth())+1) + "/" + currentDay;
    for(var i=0; i<24; i++) {
       if(i<10){
          str += "\n0" + i + "시 ";
       }else{ 
          str += "\n" + i + "시 ";
       }
       if(reservations[i].name !== "None"){
           str += ": " + reservations[i].name;  
           if(reservations[i].status === 1){str += " [★사용중★]";}
           else if(reservations[i].status === 2){ str += " [사용완료]";}
           else if(reservations[i].status === 3){ str += " [마감]";}
       }
    }
    return str;
 }

// 메시지
 function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
    if(room === ROOMS){
        ROOM2 = room;
        REPLIER2 = replier;
     }

     if(room === ROOMS){
        if(flag === true) { // 최초 실행시 실행됨
           init(true);
           flag = false;

           startTimer = setInterval(function(){
              var day = new Date();
              currentHour = day.getHours();
              reservationUser = reservations[currentHour].name;
              timeOut(currentHour); //마감 확인

              if(count === TIME){
                 count = 0;
                  if(currentLoginUser !== "None" && reservationUser !== "None" && reservationUser !== currentLoginUser){
                     REPLIER2.reply(ROOM2, "[알림]\n다음 예약자[" + reservationUser + "]님이 기다리고 있습니다.");
                  }
              }
              count++;

              if(currentDay !== day.getDate()){ // 날짜 변경을 확인하여 정보 초기화
                REPLIER2.reply(ROOM2, day.getMonth()+1 + "/" + currentDay + "일자 예약 리스트를 초기화합니다.");
                init(false, replier);
              }
           }, 1000);
        }
  
           if(msg === LOGIN){
              replier.reply(useNico(sender));
           }
  
           if(msg === LOGOUT ){
              replier.reply(stopNico(sender));
           }
  
           if(msg === LIST) { // 리스트 보여주기
              replier.reply(reservationList());
           }
           
           // 모든예약취소
           if(msg === CANCEL_ALL) { 
              if(cancelReservationAll(sender) === true){
                 replier.reply("[" + sender + "]님의 모든 예약을 취소했습니다.");
              } else {
                 replier.reply("[" + sender + "]님의 예약이 존재하지않습니다.");
              }
           }
           
           // 예약취소
           if(msg.indexOf(CANCEL) !== -1) { 
              const cutMsg_s = msg.split(' ');
              const timeMsg_s = parseInt(cutMsg_s[2].replace(/[^0-9]/g,""));
              replier.reply(cancelReservation(sender, timeMsg_s, false));
           }
           
           // 현재 시간 예약
           if(msg.indexOf(RESERVATION_NOW) !== -1) { //니꼬 납치
            if(msg.split(' ')[2] === undefined){
              replier.reply(reserv(sender, currentHour, currentHour));
            }else{
               const nowTime = parseInt(msg.split(' ')[2].replace(/[^0-9]/g,""));
               replier.reply(reserv(sender, currentHour, (currentHour + nowTime - 1)));
            }
           }
  
           // 단일 & 다중 시간 예약
           if(msg.indexOf(RESERVATION) !== -1 && msg.indexOf("취소") === -1 && msg.indexOf("업데이트") === -1) { 
              const cutMsg = msg.split(' ');
              try{
                 const timeMsg_b = cutMsg[2].split('~');
                 if(timeMsg_b[1] !== undefined){ // 다중 시간 예약
                 const startTime = parseInt(timeMsg_b[0].replace(/[^0-9]/g,""));
                 const endTime = parseInt(timeMsg_b[1].replace(/[^0-9]/g,""));
                 replier.reply(reserv(sender, startTime, endTime));
                 } else { // 단일 시간 예약
                    const timeMsg = parseInt(cutMsg[2].replace(/[^0-9]/g,""));
                    replier.reply(reserv(sender, timeMsg, timeMsg));
                 }
              } catch(e) {
                 replier.reply(e);
              }
           }
           
           // 종료
           if(msg === EXIT) {
              try{
                 clearInterval(startTimer);
                 init(false);
                 Api.off(scriptName);
                 Api.reload(scriptName);
                 replier.reply("정상적으로 종료하였습니다."); 
              }catch(e){
                 replier.reply(e);
              }
           }
           
           // 재시작
           if(msg === RESTART) {
              replier.reply("니꼬 재시작 합니다.");
              Api.off(scriptName);
              Api.reload(scriptName);
              Api.on(scriptName);
           }
           
           // 도움말
           if(msg === HELP || msg === "/니꼬"){ // 도움말
                 var help = "[명령어] " + VER + "\n"
                  + "--------------------\n"
                  + "현재시간이 포함되어있다면 바로 로그인됩니다.\n" 
                  + RESERVATION_NOW + " : 현재시간 예약\n" 
                  + RESERVATION_NOW + " 2시간 : 현재시간부터 2시간 예약\n" 
                  + RESERVATION + " 0시\n" 
                  + RESERVATION + " 0시~2시\n" 
                  + "--------------------\n"
                  + "예약시간보다 일찍 로그아웃한 경우 이후 시간은 예약취소됩니다.\n"
                  + LOGIN + "\n"
                  + LOGOUT + "\n"
                  + "--------------------\n"
                  + CANCEL + " 0시\n"  
                  + CANCEL_ALL + "\n" 
                  + "--------------------\n"
                  + LIST + "\n" 
                  + HELP + " or /니꼬";
              replier.reply(help);
           }

           if(sender === MANAGER){
            if(msg === "/저장"){
                  if(save(SDCARD, FILENAME, reservations) === true){
                     replier.reply("저장 성공");
                  }else{
                     replier.reply("저장 실패");
                  }
               }

               if(msg === "/불러오기"){
                  if(read(SDCARD, FILENAME) === true){
                     replier.reply("불러오기 성공");
                  }else{
                     replier.reply("불러오기 실패");
                  }
               }

               if(msg === "/정보"){
                  replier.reply("시간 : " + currentHour + "\n예약자 : " + reservationUser + "\n사용자 : " + currentLoginUser);
               }
            }
        }

 }

 function onStartCompile(){
   try{
       clearInterval(startTimer);
       save(SDCARD, FILENAME, reservations);
   }catch(e){
   }
}

function init(is){
   count = 0;
   reservations = new Array();
   for(var i=0; i<24; i++){
    reservations[i] = new reservations_f();
    reservations[i].name = "None";
    reservations[i].status = 0;
   }
   currentHour = new Date().getHours();
   currentDay = new Date().getDate();
   currentLoginUser = "None";
   
   if(is === true){
      read(SDCARD, FILENAME)
   }
   for(var i in reservations){
      if(reservations[i].status === 1){
         currentLoginUser = reservations[i].name;
         break;
      }
   }
   reservationUser = reservations[currentHour].name;
}