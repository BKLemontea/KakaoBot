const scriptName="manage.js";
const VER = "ver 1.2";
const MANAGER = "김재윤";

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
    //js 파일 목록
    if(sender === MANAGER && msg === "/파일목록"){
        var str="[ 파일 목록 ]";
        for(var text of Api.getScriptNames()){
            str += "\n" + text;
        }
        replier.reply(str);
    }

    //리로드할 파일 목록 & 리로드
    if(sender === MANAGER && msg.indexOf("/업데이트") !== -1 ){
        if(msg.split(" ")[2] !== undefined){
            if(msg.split(" ")[2].indexOf(".js") !== -1 ){
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2] + ".js";
            } else {
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2];
            }
            updateFile(operationJS);
        }else{
            if(msg.split(" ")[1].indexOf(".js") == -1 ){
                operationJS = msg.split(" ")[1] + ".js";
            } else {
                operationJS = msg.split(" ")[1];
            }
            updateFile(operationJS);
        }
    }

    if(sender === MANAGER && msg.indexOf("/리로드") !== -1 ){
        if(msg.split(" ")[2] !== undefined){
            if(msg.split(" ")[2].indexOf(".js") !== -1 ){
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2] + ".js";
            } else {
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2];
            }
            reloadFile(operationJS);
        }else{
            if(msg.split(" ")[1].indexOf(".js") == -1 ){
                operationJS = msg.split(" ")[1] + ".js";
            } else {
                operationJS = msg.split(" ")[1];
            }
            reloadFile(operationJS);
        }
    }

    if(sender === MANAGER && msg.indexOf("/켜기") !== -1 ){
        if(msg.split(" ")[2] !== undefined){
            if(msg.split(" ")[2].indexOf(".js") !== -1 ){
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2] + ".js";
            } else {
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2];
            }
            turnOn(operationJS);
        }else{
            if(msg.split(" ")[1].indexOf(".js") == -1 ){
                operationJS = msg.split(" ")[1] + ".js";
            } else {
                operationJS = msg.split(" ")[1];
            }
            turnOn(operationJS);
        }
    }

    if(sender === MANAGER && msg.indexOf("/끄기") !== -1 ){
        if(msg.split(" ")[2] !== undefined){
            if(msg.split(" ")[2].indexOf(".js") !== -1 ){
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2] + ".js";
            } else {
                operationJS = msg.split(" ")[1] + " " + msg.split(" ")[2];
            }
            turnOff(operationJS);
        }else{
            if(msg.split(" ")[1].indexOf(".js") == -1 ){
                operationJS = msg.split(" ")[1] + ".js";
            } else {
                operationJS = msg.split(" ")[1];
            }
            turnOff(operationJS);
        }
    }

    if(sender === MANAGER && msg === "/도움말"){
        replier.reply("[명령어] " + VER + "\n/파일목록\n/업데이트 test.js\n/리로드 test.js\n/켜기 test.js\n/끄기 test.js");
    }

    function updateFile(file){
        try{ // 리로드
            Api.off(file);
            Api.reload(file);
            Api.on(file);
            replier.reply("[" + file + "] 업데이트 완료");
        } catch(error){
            replier.reply(error);
        }
    }

    function reloadFile(file){
        try{ // 리로드
            Api.off(file);
            Api.reload(file);
            Api.on(file);
            replier.reply("[" + file + "] 리로드 완료");
        } catch(error){
            replier.reply(error);
        }
    }

    function turnOff(file){
        try{ // 끄기
            Api.off(file);
            Api.reload(file);
            replier.reply("[" + file + "]을(를) 종료합니다.");
        } catch(error){
            replier.reply(error);
        }
    }

    function turnOn(file){
        try{ // 켜기
            Api.on(file);
            replier.reply("[" + file + "]을(를) 시작합니다.");
        } catch(error){
            replier.reply(error);
        }
    }
}