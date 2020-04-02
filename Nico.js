const scriptName="Nico.js";
const ROOMS = "PNN 공부합시다"; //방 이름
const VER = "ver 1.7"; // 버전
const TIME = 60 * 5; //알람 주기
const MANAGER = "김재윤";
const EMPTY = "None";

// 파일 저장 & 읽기
const SDCARD = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/katalkbot/lib/nico/"; //절대 경로
const FILENAME = "reservations.txt";
const FILENAME_LOGOUT = "로그아웃.txt";
const FILENAME_RANKING = "RANKING.txt";

// 명령어
const SC = "/";
const NICO = SC + "니꼬 ";

const HELP = NICO + "도움말";

const RESERVATION_NOW = NICO + "납치";
const RESERVATION = NICO + "예약";

const LOGIN = NICO + "로그인";
var LOGOUT = new Array(
   NICO + "로그아웃"
);

const CANCEL = NICO + "예약취소";
const CANCEL_ALL = NICO + "모든예약취소";

const LIST = NICO + "리스트";
const RECORD = NICO + "사용기록";
const NOTICE = NICO + "공지사항";

const COMMAND = NICO + "명령어";

const COMMAND_LIST = new Array(
   "/니꼬",
   SC,
   NICO,
   HELP,
   RESERVATION_NOW,
   RESERVATION,
   LOGIN,
   LOGOUT[0],
   CANCEL,
   CANCEL_ALL,
   LIST,
   RECORD,
   NOTICE,
   COMMAND,
   COMMAND + " 추가",
   COMMAND + " 삭제",
);

var currentDay; // 현재 날짜
var currentHour; // 현재 시간
var currentLoginUser; // 현재 사용중인 유저
var reservationUser; // 예약되어있는 유저
var frequencys; //사용 기록
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

// 구조체
function reservations_f() {
   var name;
   var status; // 0은 사용전, 1은 사용중, 2는 사용완료, 3은 마감
}

// 사용
function useNico(sender) {
   let useNico_flag = false;
   for (var i in reservations) {
      if (reservations[i].name === sender && i >= currentHour && reservations[i].status === 0 && reservationUser === sender && (currentLoginUser === EMPTY || currentLoginUser === sender)) {
         reservations[i].status = 1; // 사용중
         useNico_flag = true;
      } else if (useNico_flag === true && reservations[i].name !== sender) break;
   }
   if (useNico_flag === true) {
      currentLoginUser = sender;
      addRANKING(sender);
      return "[" + sender + "]님이 로그인했습니다.";
   } else {
      return "로그인 실패";
   }
}

// 사용완료
function stopNico(sender) {
   if (currentLoginUser === sender) {
      for (var i in reservations) {
         if (reservations[i].name === sender && reservations[i].status === 1) {
            if (i < currentHour) {
               reservations[i].status = 2; // 사용완료
            } else {
               cancelReservation(sender, i, true);
            }
         }
      }
      currentLoginUser = EMPTY;
      return "[" + sender + "]님이 로그아웃했습니다.";
   } else {
      return "[" + sender + "]님은 로그인 상태가 아닙니다.";
   }
}

// 시간 만료
function timeOut(time) {
   for (var i in reservations) {
      if (reservations[i].status === 0 && i < time) {
         reservations[i].status = 3;
      }
   }
}

// 중복된 명령어 확인
function check_command_list(check_command, command_list){
   for(var command of command_list){
      if(command === check_command){
         return false;
      }
   }
   return true;
}

// 명령어 리스트 저장
function save_command(add_command, is){
   try {
      var folder = new java.io.File(SDCARD);
      folder.mkdirs();
      var file = new java.io.File(SDCARD + FILENAME_LOGOUT);
      var fos = new java.io.FileOutputStream(file);
      var contentstring = "";

      if(is === true){
         // "/니꼬 " 가 포함되어있지 않다면
         if(add_command.indexOf(NICO) === -1){ 
            add_command = NICO + add_command;
         }

         // 기본 명령어와 중복 확인
         if(check_command_list(add_command, COMMAND_LIST) === false){
            return "기본 명령어와 중복하여 추가할 수 없습니다.";
         }

         // 로그아웃 명령어와 중복 확인
         if(check_command_list(add_command, LOGOUT) === false){
            return "이미 존재하는 명령어 입니다.";
         }

         LOGOUT.push(add_command);
      }
      
      for(var i=1; i<LOGOUT.length; i++){
         contentstring += LOGOUT[i].replace(NICO, '') + "\n";
      }

      contentstring = new java.lang.String(contentstring.slice(0, -1));
      fos.write(contentstring.getBytes());
      fos.close();
   } catch (e) {
      return e;
   }
   return "[" + add_command + "] 명령어 추가 완료";
}

// 명령어 리스트 불러오기
function load_command(){
   let file = new java.io.File(SDCARD + FILENAME_LOGOUT);
   if (file.exists() == false) return null;
   try {
      let fis = new java.io.FileInputStream(file);
      let isr = new java.io.InputStreamReader(fis);
      let br = new java.io.BufferedReader(isr);
      let temp_br = "";
      let temp_readline = "";
      while (true) {
         if ((temp_readline = br.readLine()) === null) break;
         temp_br += temp_readline + "\n";
      }
      temp_br = temp_br.slice(0, -1);

      let temp_reserv = temp_br.split("\n");
      for (var command of temp_reserv) {
         if(check_command_list(NICO + command, LOGOUT) == true){
            LOGOUT.push(NICO + command);
         }
      }

      try {
         fis.close();
         isr.close();
         br.close();
         return "명령어 불러오기 완료";
      } catch (e) {
         return e;
      }
   } catch (e) {
      return e;
   }
}

// 명령어 삭제
function del_command(del_com){
   if(del_com.indexOf(NICO) === -1){
      del_com = NICO + del_com;
   }

   // 기본 명령어와 중복 확인
   if(check_command_list(del_com, COMMAND_LIST) === false){
      return "기본 명령어는 삭제할 수 없습니다.";
   }

   if(check_command_list(del_com, LOGOUT[0]) === false){
      return "기본 명령어는 삭제할 수 없습니다.";
   }

   for(var i=1; i<LOGOUT.length; i++){
      if(LOGOUT[i] === del_com){
         LOGOUT.splice(i,1);
         save_command("", false);
         return "[" + del_com + "] 명령어 삭제 완료";
      }
   }
   return "[" + del_com + "] 명령어가 존재하지 않습니다.";
}

// 파일 저장
function save(content) {
   try {
      let folder = new java.io.File(SDCARD);
      folder.mkdirs();
      let file = new java.io.File(SDCARD + FILENAME);
      let fos = new java.io.FileOutputStream(file);
      let contentstring = "";
      for (var i in content) {
         contentstring += reservations[i].name + "|" + reservations[i].status + "\n";
      }
      contentstring = new java.lang.String(contentstring.slice(0, -1));
      fos.write(contentstring.getBytes());
      fos.close();
   } catch (e) {
      return e;
   }
   return "저장 성공";
}

// 파일 읽기
function read() {
   let file = new java.io.File(SDCARD + FILENAME);
   if (file.exists() == false) return null;
   try {
      let fis = new java.io.FileInputStream(file);
      let isr = new java.io.InputStreamReader(fis);
      let br = new java.io.BufferedReader(isr);
      let temp_br = "";
      let temp_readline = "";
      while (true) {
         if ((temp_readline = br.readLine()) === null) break;
         temp_br += temp_readline + "\n";
      }
      temp_br = temp_br.slice(0, -1);

      let temp_reserv = temp_br.split("\n");
      for (var i = 0; i < 24; i++) {
         reservations[i].name = temp_reserv[i].split("|")[0];
         reservations[i].status = parseInt(temp_reserv[i].split("|")[1]);
      }
      try {
         fis.close();
         isr.close();
         br.close();
         return "불러오기 성공";
      } catch (e) {
         return e;
      }
   } catch (e) {
      return e;
   }
}

// 중복 시간 확인
function checkOverlap(m) {
   if (reservations[m].name !== EMPTY) {
      return true;
   }
   return false;
}

// 예약
function reserv(sender, start, end) {
   if ((start >= 0 && start < 24) && (end >= 0 && end < 24) && start <= end) {
      for (var i = start; i <= end; i++) {
         if (i < currentHour) {
            if (start === end) {
               return "예약이 마감된 시간입니다.";
            } else {
               return "예약이 마감된 시간을 포함하고 있습니다.";
            }
         }

         if (checkOverlap(i) === true) {
            if (start === end) {
               return "이미 예약이 완료된 시간입니다.";
            } else {
               return "이미 예약이 완료된 시간을 포함하고 있습니다.";
            }
         }
      }

      for (var i = start; i <= end; i++) {
         reservations[i].name = sender;
         if (i !== 0) {
            if (reservations[i - 1].name === sender && reservations[i - 1].status === 1) {
               reservations[i].status = 1;
            }
         }
      }

      if (start === currentHour || (reservations[start - 1].name === sender && reservations[start - 1].status === 1)) {
         reservationUser = reservations[currentHour].name;
         if (reservationUser === sender) {
            useNico(sender);
         }
      }

      if (start === end) {
         return "[" + sender + "]님께서 " + start + "시에 예약하셨습니다.";
      } else {
         return "[" + sender + "]님께서 " + start + "시부터 " + end + "시까지 예약하셨습니다.";
      }

   } else {
      return "정확한 형식으로 입력해주세요.";
   }
}

// 예약 취소
function cancelReservation(sender, time, is) {
   if (reservations[time].name === sender) {
      if (reservations[time].status !== 1 || is === true) {
         reservations[time] = new reservations_f();
         reservations[time].name = EMPTY;
         reservations[time].status = 0;

         if (new Date().getHours() == time) {
            reservationUser = EMPTY;
         }

         return time + "시에 예약되어있던 [" + sender + "]님의 예약을 취소하였습니다.";
      } else {
         return "로그아웃부터 해주시기 바랍니다.";
      }
   }
   return "일치하는 정보가 없습니다.";
}

// 모든 예약 취소
function cancelReservationAll(sender) {
   var cancelReservAll = false;
   for (var i in reservations) {
      if (reservations[i].name === sender) {
         reservations[i] = new reservations_f();
         reservations[i].name = EMPTY;
         reservations[i].status = 0;
         cancelReservAll = true;
      }
   }
   if (cancelReservAll === true) {
      if (currentLoginUser === sender) {
         currentLoginUser = EMPTY;
      }
      if (reservationUser === sender) {
         reservationUser = EMPTY;
      }
      return "[" + sender + "]님의 모든 예약을 취소했습니다.";
   }
   return "[" + sender + "]님의 예약이 존재하지않습니다.";
}

// 예약 리스트 보여주기
function reservationList() {
   var str = "[예약 리스트] " + (new Date().getMonth() + 1) + "/" + currentDay;
   for (var i = 0; i < 24; i++) {
      if (i < 10) {
         str += "\n0" + i + "시 ";
      } else {
         str += "\n" + i + "시 ";
      }
      if (reservations[i].name !== EMPTY) {
         str += ": " + reservations[i].name;
         if (reservations[i].status === 1) {
            str += " [★로그인★]";
         } else if (reservations[i].status === 2) {
            str += " [로그아웃]";
         } else if (reservations[i].status === 3) {
            str += " [시간만료]";
         }
      }
   }
   return str;
}

// RANKING
function todayRANKING() {
   if(frequencys.length == 0){
      return "아무도 사용하지 않았네요ㅠㅠ";
   }else{
      if (frequencys.length > 1) { //비교대상이 두명 이상일때
         frequencys.sort(function (a, b) { //횟수가 많은 순으로 정렬
            return a.time > b.time ? -1 : a.time < b.time ? 1 : 0;
         });
      }

      let text = "[랭킹]\n순위\t이름\t시간\n";
      for(var i in frequencys){
         let hour = parseInt(frequencys[i].time/3600);
         let min = parseInt((frequencys[i].time%3600)/60);
         let sec = frequencys[i].time%60;
         text += (parseInt(i) + 1) + "위\t" + frequencys[i].username + "\t" + hour + ":" + min + ":" + sec + "\n";
      }
      return text.slice(0, -1);
   }
}

function addRANKING(sender){
   if(frequencys.length != 0){
      for(var fre of frequencys){
         if(fre.username == sender){
            return false;
         }
      }
   }

   frequencys.push({
      username: sender,
      time: 0
   });
   return true;
}

function countRANKING(){
   if(currentLoginUser == EMPTY){
      return false;
   }

   for(var fre of frequencys){
      if(fre.username == currentLoginUser){
         fre.time++;
         return true;
      }
   }

   return addRANKING(currentLoginUser);
}

function listRANKING(){
   if(frequencys.length == 0){
      return "아직 아무도 사용한 기록이 없습니다.";
   }else{
      let text = "[사용 기록]\n";
      for(var fre of frequencys){
         let hour = parseInt(fre.time/3600);
         let min = parseInt((fre.time%3600)/60);
         let sec = fre.time%60;
         text += "[" + fre.username + "] " + hour + ":" + min + ":" + sec + "\n";
      }
      return text.slice(0, -1);
   }
}

// RANKING 기록 저장
function saveRANKING() {
   try {
      if(frequencys.length > 0){
         let folder = new java.io.File(SDCARD);
         folder.mkdirs();
         let file = new java.io.File(SDCARD + FILENAME_RANKING);
         let fos = new java.io.FileOutputStream(file);
         let contentstring = "";
         for (var fre of frequencys) {
            contentstring += fre.username + "|" + fre.time + "\n";
         }
         contentstring = new java.lang.String(contentstring.slice(0, -1));
         fos.write(contentstring.getBytes());
         fos.close();
      }
   } catch (e) {
      return e;
   }
   return "저장 성공";
}

// RANKING 기록 불러오기
function loadRANKING() {
   let file = new java.io.File(SDCARD + FILENAME_RANKING);
   if (file.exists() == false) return null;
   try {
      let fis = new java.io.FileInputStream(file);
      let isr = new java.io.InputStreamReader(fis);
      let br = new java.io.BufferedReader(isr);
      let temp_br = "";
      let temp_readline = "";
      while (true) {
         if ((temp_readline = br.readLine()) === null) break;
         temp_br += temp_readline + "\n";
      }
      temp_br = temp_br.slice(0, -1);

      let temp_reserv = temp_br.split("\n");
      for (var temp of temp_reserv) {
         frequencys.push({
            username: temp.split("|")[0],
            time: parseInt(temp.split("|")[1])
         });
      }
      try {
         fis.close();
         isr.close();
         br.close();
         return "불러오기 성공";
      } catch (e) {
         return e;
      }
   } catch (e) {
      return e;
   }
}

function interval(replier) { //
   init(true);
   flag = false;

   startTimer = setInterval(function () {
      let day = new Date();
      countRANKING();

      if (currentDay !== day.getDate()) { // 날짜 변경을 확인하여 정보 초기화 및 재시작
         replier.reply(todayRANKING());
         replier.reply("[" + day.getMonth() + 1 + "/" + day.getDate() + "]\n새로운 예약리스트를 진행합니다.");
         init(false);
         save(reservations);
         saveRANKING();
         save_command("", false);
      }

      if (currentHour !== day.getHours()) {
         currentHour = day.getHours();
         reservationUser = reservations[currentHour].name;
         timeOut(currentHour); //마감 확인

         if (currentLoginUser !== EMPTY && reservationUser === EMPTY) { //자동 시간 연장
            reserv(currentLoginUser, currentHour, currentHour);
            replier.reply("[" + currentLoginUser + "]님의 예약 시간을 1시간 연장했습니다.");
         }

         save(reservations); //정보 저장
      }

      if (currentLoginUser !== EMPTY && reservationUser !== EMPTY && currentLoginUser !== reservationUser) { //독촉장
         if (count >= TIME) {
            count = 0;
            replier.reply("[알림]\n다음 예약자[" + reservationUser + "]님이 기다리고 있습니다.");
         }
         count++;
      } else {
         if (count !== 0) {
            count = 0;
         }
      }
   }, 1000);
}

// 메시지
function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId) {
   try{
      if (room === ROOMS) {
         if (flag === true) { // 최초 실행시 실행됨
            interval(replier);
         }

         // 도움말
         if (msg.indexOf(HELP) !== -1 || msg === "/니꼬") { // 도움말
            let help = "[명령어] " + VER + "\n" +
               "--------------------\n";
            
            try{
            if(msg.indexOf(RESERVATION_NOW.replace(NICO, '')) !== -1){
               help += RESERVATION_NOW + " : 현재시간 예약\n"
                  + RESERVATION_NOW + " 2시간 : 현재시간부터 2시간 예약\n"
                  + "자동 로그인";
            }

            else if(msg.indexOf(RESERVATION.replace(NICO, '')) !== -1){
               help += RESERVATION + " 0시 : 0시 예약\n"
                  + RESERVATION + " 0시~2시 : 0시 ~ 2시 예약\n"
                  + "현재시간이 포함되어있다면 자동 로그인";
            }

            else if(msg.indexOf(LOGIN.replace(NICO, '')) !== -1){
               help += LOGIN + "\n"
                  + "정말 설명이 필요하신가요?";
            }

            else if(msg.indexOf(LOGOUT[0].replace(NICO, '')) !== -1){
               for(var logoutMsg of LOGOUT){
                  help += logoutMsg + "\n";
               }
               help += "로그아웃시 예약한 시간이 남아있다면 이후 시간은 자동으로 예약취소합니다.";
            }

            else if(msg.indexOf(CANCEL.replace(NICO, '')) !== -1){
               help += LOCANCELGIN + " 0시\n"
                  + "0시에 예약을 취소합니다.";
            }

            else if(msg.indexOf(CANCEL_ALL.replace(NICO, '')) !== -1){
               help += CANCEL_ALL + "\n"
                  + "사용자의 모든 예약을 취소합니다.";
            }

            else if(msg.indexOf(LIST.replace(NICO, '')) !== -1){
               help += LIST + "\n"
                  + "예약 리스트를 보여줍니다.";
            }

            else if(msg.indexOf(RECORD.replace(NICO, '')) !== -1){
               help += RECORD + "\n"
                  + "사용자들의 니꼬 사용 시간을 보여줍니다.";
            }

            else if(msg.indexOf(NOTICE.replace(NICO, '')) !== -1){
               help += NOTICE + "\n"
                  + "고오오오오옹지사항";
            }

            else if(msg.indexOf(COMMAND.replace(NICO, '')) !== -1){
               help += COMMAND + " 추가 : 명령어이름\n" +
                  COMMAND + " 삭제 : 명령어이름\n" +
                  "기본 명령어는 삭제가 불가능합니다.\n" +
                  "/니꼬는 안붙혀도 상관없습니다.\n" +
                  "현재는 로그아웃만 학습 가능합니다.";
            }

            else{
               help += HELP + " 납치" + "\n" +
               "--------------------\n" +
               RESERVATION_NOW + "\n" +
               RESERVATION + "\n" +
               LOGIN + "\n"+
               LOGOUT[0] + "\n" +
               CANCEL + "\n" +
               CANCEL_ALL + "\n" +
               LIST + "\n" +
               RECORD + "\n" +
               NOTICE + "\n" +
               "--------------------\n" +
               COMMAND;
            }
            replier.reply(help);
            }catch(e){
               replier.reply(e);
            }
         }

         // 명령어 추가, 삭제
         else if(msg.indexOf(COMMAND) !== -1){
            try{
               let boundary_line = ':';
               if(msg.indexOf("추가")!== -1){
                  let add_cmd = msg.split(boundary_line)[1];
                  add_cmd = add_cmd.trim();
                  replier.reply(save_command(add_cmd, true));
               }else if(msg.indexOf("삭제")!== -1){
                  let del_cmd = msg.split(boundary_line)[1];
                  del_cmd = del_cmd.trim();
                  replier.reply(del_command(del_cmd));
               }
            }catch(e){
               replier.reply("형식을 지켜주세요.");
            }
         }

         // 로그인
         else if (msg === LOGIN) {
            replier.reply(useNico(sender));
         }

         // 리스트 보여주기
         else if (msg === LIST) { 
            replier.reply(reservationList());
         }

         // 사용기록 보여주기
         else if (msg === RECORD) { 
            replier.reply(listRANKING());
         }

         // 모든예약취소
         else if (msg === CANCEL_ALL) {
            replier.reply(cancelReservationAll(sender));
         }

         // 예약취소
         else if (msg.indexOf(CANCEL) !== -1) {
            let cutMsg_s = msg.split(' ');
            try{
               let timeMsg_s = parseInt(cutMsg_s[2].replace(/[^0-9]/g, ""));
               replier.reply(cancelReservation(sender, timeMsg_s, false));
            }catch(e){
               replier.reply("시간을 입력해주세요.");
            } 
         }

         // 현재 시간 예약
         else if (msg.indexOf(RESERVATION_NOW) !== -1) { //니꼬 납치
            if (msg.split(' ')[2] === undefined) {
               replier.reply(reserv(sender, currentHour, currentHour));
            } else {
               let addTime = parseInt(msg.split(' ')[2].replace(/[^0-9]/g, ""));
               replier.reply(reserv(sender, currentHour, (currentHour + addTime - 1)));
            }
         }

         // 단일 & 다중 시간 예약
         else if (msg.indexOf(RESERVATION) !== -1 && msg.indexOf("취소") === -1 && msg.indexOf("업데이트") === -1) {
            let cutMsg = msg.split(' ');
            try {
               let timeMsg_b = cutMsg[2].split('~');
               if (timeMsg_b[1] !== undefined) { // 다중 시간 예약
                  let startTime = parseInt(timeMsg_b[0].replace(/[^0-9]/g, ""));
                  let endTime = parseInt(timeMsg_b[1].replace(/[^0-9]/g, ""));
                  replier.reply(reserv(sender, startTime, endTime));
               } else { // 단일 시간 예약
                  let timeMsg = parseInt(cutMsg[2].replace(/[^0-9]/g, ""));
                  replier.reply(reserv(sender, timeMsg, timeMsg));
               }
            } catch (e) {
               replier.reply(e);
            }
         }

         else if (msg === NOTICE) {
            const noticeMsg = "[공지사항]\n" +
               "--------------------\n" +
               "명령어 학습기능은 [로그아웃]만 가능합니다.\n" +
               "기존 MVP 기능을 삭제하고 랭킹으로 변경\n" +
               "랭킹은 별도의 명령어 없이 자동으로 작동되며, 초단위로 기록됩니다.";
            replier.reply(noticeMsg);
         }

         else{
            //로그아웃
            for (var logoutMsg of LOGOUT) {
               if (msg === logoutMsg) {
                  replier.reply(stopNico(sender));
               }
            }

         }

         // 관리자 전용 명령어
         if (sender === MANAGER) {
            if (msg === "/랭킹") {
               replier.reply(todayRANKING());
            }

            else if (msg === "/초기화") {
               replier.reply("초기화를 진행합니다.");
               init(false);
               save(reservations);
               saveRANKING();
               save_command("", false);
            }

            else if (msg === "/명령어 초기화"){
               LOGOUT = new Array(NICO+"로그아웃");
               try{
                  save_command("", false);
                  replier.reply("명령어 초기화 완료");
               }catch(e){
                  replier.reply("명령어 초기화 에러 발생");
               }
            }

            else if (msg === "/저장") {
               replier.reply(save(reservations));
               replier.reply(saveRANKING());
            }

            else if (msg === "/불러오기") {
               replier.reply(read());
               replier.reply(loadRANKING());
            }

            else if (msg === "/정보") {
               replier.reply("시간 : " + currentHour + "\n예약자 : " + reservationUser + "\n사용자 : " + currentLoginUser);
            }

            // 종료
            else if (msg === "/종료") {
               try {
                  clearInterval(startTimer);
                  init(false);
                  Api.off(scriptName);
                  Api.reload(scriptName);
                  replier.reply("정상적으로 종료하였습니다.");
               } catch (e) {
                  replier.reply(e);
               }
            }

         }
      }
   } catch(e){
      replier.reply(e);
   }
}

function onStartCompile() {
   try {
      clearInterval(startTimer);
      save(reservations);
      saveRANKING();
   } catch (e) {}
}

function init(is){
   count = 0;
   reservations = new Array();
   frequencys = new Array();
   for (var i = 0; i < 24; i++) {
      reservations[i] = new reservations_f();
      reservations[i].name = EMPTY;
      reservations[i].status = 0;
   }
   currentHour = new Date().getHours();
   currentDay = new Date().getDate();
   currentLoginUser = EMPTY;

   if (is === true) {
      load_command();
      read();
      loadRANKING();
      for (var i in reservations) {
         if (reservations[i].status === 1) {
            currentLoginUser = reservations[i].name;
            break;
         }
      }
      reservationUser = reservations[currentHour].name;
   } else {
      reservationUser = EMPTY;
   }
}