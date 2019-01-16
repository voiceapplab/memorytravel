'use strict';

//TimeZone
process.env.TZ = 'Asia/Tokyo';

const {
    dialogflow,
    Suggestions,
    SimpleResponse
} = require('actions-on-google');

//Use Firebase Functions
const functions = require('firebase-functions');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const Speech = require('ssml-builder');
const app = dialogflow({debug: true});
var webclient = require("request");
var client = require('cheerio-httpcli');

//weather datasource URL
//当日天気データ
var weatherUrl ="http://www.data.jma.go.jp/obd/stats/etrn/view/daily_s1.php?prec_no=44&block_no=47662";

// Max number for NEWS article 
// Wikipedia読み上げ記事数最大値
const maxNumber = 3;

//Sound file list サウンドファイルリスト
const sounds = {
    opening:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/ver2-20181108%2Fopening.mp3?alt=media&amp;token=d4368919-b855-42af-a497-1289ccf8f11b"},
    na_00:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_00.mp3?alt=media&amp;token=bbeb9392-b807-45b1-b556-b141dcbe0ecf"},
    na_01:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/ver2-20181108%2Fna_01.mp3?alt=media&amp;token=afcc8578-a48c-4521-99ce-9ec24b24ad96"},
    na_02:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_02.mp3?alt=media&amp;token=c1f1bcfa-0daf-45ab-8217-7a2a7a217b3b"},
    na_03:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_03.mp3?alt=media&amp;token=38b71376-fb36-432f-98a0-b42149daddc6"},
    na_04:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_04.mp3?alt=media&amp;token=6b6025ff-f88a-4523-85aa-5cac78b0bd95"},
    na_05:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_05.mp3?alt=media&amp;token=da6a2e16-4e43-4a3f-834f-dbfb4f934cd9"},
    na_06:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_06.mp3?alt=media&amp;token=db11d95a-691b-4d59-beb4-c1cf3b89cbfa"},
    na_07:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/na_07.mp3?alt=media&amp;token=25e20358-334b-4000-8b32-e7559ee0dfd8"},
    na_08:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/ver2-20181108%2Fna_08.mp3?alt=media&amp;token=12ab71b4-14f0-413e-b349-797be0aa7406"},
    se_logo:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/ver2-20181108%2Fse_loco.mp3?alt=media&amp;token=d060c003-1171-49c4-bf77-91836058eae6"},
    ending:{url:"https://firebasestorage.googleapis.com/v0/b/memorytravel-4f3c0.appspot.com/o/ver2-20181108%2Fending.mp3?alt=media&amp;token=e60057b0-ec81-4f15-ae65-228c1509aec4"}

}

app.intent('Default Welcome Intent', welcome);

function welcome(conv){
    var currentDate = new Date();
    var diff = 1;
    //diff(時差)取得 
    if(conv.user.storage.lastDate){
        console.log(`============lastDate:${lastDate}================`);

        var lastDate = new Date(conv.user.storage.lastDate);
        diff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    }
    conv.user.storage.lastDate = currentDate;

    let text = "(この「記憶の旅」は音声アプリです。音声の応答でお楽しみください。)\n\n\n\n";

    //時差が30分(0.5)以上あればオープニングを流す
    if(diff > 0.5){
        text += "10年前のあの日、あなたは何を感じていたのでしょうか？あなたの人生のあの時を再び体験できる、「記憶の旅」へ、ようこそ。";
    }
    
    if(!conv.user.storage.currentAge){
        text += "さて、記憶の旅に出る前に、あなたの年齢を伺います。";
        text += "あなたは今何歳ですか？";
        let speech = new Speech();
    
        speech.audio(sounds.opening.url);
        speech.say('さて、記憶の旅に出る前に、あなたの年齢を伺います。');
        speech.say('あなたは今何歳ですか？');
    
        conv.ask(new SimpleResponse({
            speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
            text: text,
        }));
        // conv.ask(new Suggestions('60歳'));
        // conv.ask(new Suggestions('70歳'));
    }else{
        let speech = new Speech();
        text += "お帰りなさい。またお目にかかれて嬉しいです。";
        text += `あなたの年齢は、${conv.user.storage.currentAge}歳であっていますか？`;
        speech.say('。');
        speech.pause('2000ms');
        //時差が30分(0.5)以上あればオープニングを流す
        if(diff > 0.5){
            speech.audio(sounds.opening.url);
        }
        speech.audio(sounds.na_01.url);
        speech.pause('700ms');
        //speech.audio(sounds.na_03.url);
        speech.say('あなたの年齢は、');
        speech.pause('700ms');
        speech.say(`${conv.user.storage.currentAge}歳`);
        speech.pause('700ms');
        speech.say('であっていますか？');
        //speech.audio(sounds.na_04.url);
        conv.ask(new SimpleResponse({
            speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
            text: text,
        }));
        conv.ask(new Suggestions('はい'));
        conv.ask(new Suggestions('いいえ'));
    }


}

app.intent('setAge',(conv) =>{
    let parameters = conv.parameters || {}; 
    console.log(parameters);
    let currentAge = parameters.age;
    conv.user.storage.currentAge = currentAge;

    let speech = new Speech();
    let text = `あなたの年齢は、${currentAge}歳であっていますか？`;
    //speech.audio(sounds.na_03.url);
    speech.say('あなたの年齢は、');
    speech.pause('700ms');
    speech.say(`${currentAge}歳`);
    speech.pause('700ms');
    //speech.audio(sounds.na_04.url);
    speech.say('であっていますか？');
    conv.ask(new SimpleResponse({
        speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
        text: text,
    }));
    conv.ask(new Suggestions('はい'));
    conv.ask(new Suggestions('いいえ'));
});

app.intent('setRightAgeAgain',(conv) =>{
    let text = "おっと、違うのですね。それではもう一度年齢をセットします。";
    text += "あなたは今何歳ですか？";
    let speech = new Speech();

    //speech.audio("");
    //speech.audio(sounds.na_05.url);
    speech.say('おっと、違うのですね。それではもう一度年齢をセットします。');
    speech.pause('700ms');
    //speech.audio(sounds.na_02.url);
    speech.say('あなたは今何歳ですか？');

    conv.ask(new SimpleResponse({
        speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
        text: text,
    }));
    // conv.ask(new Suggestions('60歳'));
    // conv.ask(new Suggestions('70歳'));
});

app.intent('completeSetAge',(conv)=>{
    let text = "わかりました。それでは早速記憶の旅にでかけましょう。";
    text += "あなたが何歳の時、またはどの年代の出来事をききますか？";
    let speech = new Speech();

    //speech.audio("");
    //speech.audio(sounds.na_06.url);
    speech.say('わかりました。それでは早速記憶の旅にでかけましょう。');
    speech.pause('700ms');
    //speech.audio(sounds.na_07.url);
    speech.say('あなたが何歳の時、またはどの年代の出来事をききますか？');

    conv.ask(new SimpleResponse({
        speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
        text: text,
    })); 
    // conv.ask(new Suggestions('1980年'));
    // conv.ask(new Suggestions('昭和45年'));
    // conv.ask(new Suggestions('40年前'));
});



app.intent('travelIntro',(conv) => {
    return new Promise(function (resolve,reject){
        let parameters = conv.parameters || {};
        var [ageMode,showaMode,heiseiMode,adMode,schoolMode,agoMode] = [false,false,false,false,false,false];
        var showa,heisei,ad;
        var mode = null;

        //モード選択
        if(parameters.age){
            ageMode = true;
        }else if(parameters.showa){
            showa = parseInt(parameters.showa);
            showaMode = true;
            mode = "showa";
        }else if(parameters.heisei){
            heisei = parseInt(parameters.heisei);
            heiseiMode = true;
            mode = "heisei";
        }else if(parameters.ad){
            ad = parseInt(parameters.ad);
            adMode = true;
        }else if(parameters.school){
            schoolMode = true;
        }else if(parameters.ago){
            agoMode = true;
        }

        var age;//当時年齢
        var ago;//何年前

        if(ageMode){
            age = parameters.age
            ago = conv.user.storage.currentAge - age;
        }else if(showaMode){
            var adYear = showaToAdYear(showa);
            ago = new Date().getFullYear() - adYear;
            age = conv.user.storage.currentAge - ago;
        }else if(heiseiMode){
            var adYear = heiseiToAdYear(heisei);
            ago = new Date().getFullYear() - adYear;
            age = conv.user.storage.currentAge - ago;
        }else if(adMode){
            var adYear = ad;
            ago = new Date().getFullYear() - adYear;
            age = conv.user.storage.currentAge - ago;
        }else if(schoolMode){
            switch(parameters.school) {
                case '小学生':
                    console.log('小学生');
                    age = 10;
                    break;
                case '中学生':
                    console.log('中学生');
                    age = 14;
                    break;
                case '高校生':
                    console.log('高校生');
                    age = 16;
                    break;
                case '大学生':
                    console.log('大学生');
                    age = 20;
                    break;
            }
            ago = conv.user.storage.currentAge - age;
        }else if(agoMode){
            ago = parseInt(parameters.ago);
            age = conv.user.storage.currentAge - ago;
        }
        
        //未来エラー
        if(ago < 0){
            conv.ask(new SimpleResponse({
                speech: "すみません。私は過去への旅しかできません。未来は貴方次第です。もう一度、行きたい年齢か行きたい年代を言って下さい。",
                text: "すみません。私は過去への旅しかできません。未来は貴方次第です。もう一度、行きたい年齢か行きたい年代を言って下さい。",
            }));
            resolve();
        }

        let year = new Date().getFullYear() - ago;
        var month = new Date().getMonth() + 1;
        let day = new Date().getDate();

        //Wikiにデータがない年代用エラー
        if(year < 1900){
            conv.ask(new SimpleResponse({
                speech: "すみません。遠い過去の記憶は少し曖昧なのでお伝えすることが難しいです。もう少し近い時期をお願いします。もう一度、行きたい年齢か行きたい年代を言って下さい。",
                text: "すみません。遠い過去の記憶は少し曖昧なのでお伝えすることが難しいです。もう少し近い時期をお願いします。もう一度、行きたい年齢か行きたい年代を言って下さい。",
            }));
            resolve();
        }
        
        let text = "";
        let speech = new Speech();

        if(ageMode){
            text += `${age}歳ですね。わかりました。それでは旅に出ましょう。\n` ;
            speech.say(`${age}歳ですね。わかりました。`);
            text += `${ago}年まえの${year}年、${month}月${day}日につきました。`;
        }else if(showaMode){

            text += `昭和${showa}年ですね。わかりました。それでは旅に出ましょう。\n` ;
            speech.say(`昭和${showa}年ですね。わかりました。`);
            text += `${ago}年まえの昭和${showa}年、${month}月${day}日につきました。`;
        }else if(heiseiMode){

            text += `平成${heisei}年ですね。わかりました。それでは旅に出ましょう。\n` ;
            speech.say(`平成${heisei}年ですね。わかりました。`);
            text += `${ago}年まえの平成${heisei}年、${month}月${day}日につきました。`;
        }else if(adMode){

            text += `西暦${ad}年ですね。わかりました。それでは旅に出ましょう。\n` ;
            speech.say(`西暦${ad}年ですね。わかりました。`);
            text += `${ago}年まえの西暦${year}年、${month}月${day}日につきました。`;
        }else if(schoolMode){
            text += `${parameters.school}ですね。わかりました。それでは旅に出ましょう。\n` ;
            speech.say(`${parameters.school}ですね。わかりました。`);
            text += `${ago}年まえの${year}年、${month}月${day}日につきました。`;
        }else if(agoMode){
            text += `${ago}年前ですね。わかりました。それでは旅に出ましょう。\n` ;
            speech.say(`${ago}年前ですね。わかりました。`);
            text += `${ago}年まえの${year}年、${month}月${day}日につきました。`;
        }
        speech.pause('700ms');
        //それでは旅に出ましょう。
        speech.audio(sounds.na_08.url);
        
        if(age < 0){
            text += `あなたが生まれる${Math.abs(age)}年前です。\n`; 
        }else{
            text += `あなたは${age}歳です。\n`;
        }

        getWikiContent(year,month).then(getEventArray).then(getWeather).then(function(promiseArr){
            speech.pause('900ms');
            speech.audio(sounds.se_logo.url);
            speech.pause('2000ms');
            if(ageMode || adMode || schoolMode || agoMode){
                speech.say(`${ago}年まえの${year}年、`);
            }else if(showaMode){
                speech.say(`${ago}年まえの昭和${showa}年、`);
            }else if(heiseiMode){
                speech.say(`${ago}年まえの平成${heisei}年、`);
            }

            speech.say(`${month}月${day}日につきました。`);

            if(age < 0){
                speech.say(`あなたが生まれる${Math.abs(age)}年前です。`); 
            }else{
                speech.say(`あなたは${age}歳です。`);
            }
            
            speech.pause('800ms');
            speech.say(`この日の東京の天気は${promiseArr[2]}です。`);
            text += `この日の東京の天気は${promiseArr[2]}です。\n`;
            speech.pause('1000ms');
            promiseArr[0].forEach(function(el,index){
                if(el === `${month}月${day}日`){
                    speech.say(`この日あった出来事は「${promiseArr[1][index]}」です。`);
                    text += `この日あった出来事は「${promiseArr[1][index]}」です。\n`;
                }
            });
            //speech.say(event);
            speech.pause('1000ms');
            speech.say(`この年の${month}月にあった出来事を聞きますか？`);
            text += `この年の${month}月にあった出来事を聞きますか？\n`;

            conv.user.storage.month = month;
            conv.user.storage.ago = ago;
            conv.user.storage.mode = mode;
            conv.ask(new SimpleResponse({
                speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
                text: text,
            }));
            conv.ask(new Suggestions('はい'));
            conv.ask(new Suggestions('いいえ'));
            resolve();
        });
    });
});

app.intent('travel',(conv) =>{

    return new Promise(function (resolve,reject){
        let parameters = conv.parameters || {}; 
        let month = parameters.month ?  parameters.month : conv.user.storage.month;
        let ago = conv.user.storage.ago;
        let year = new Date().getFullYear() - ago;
        let mode = conv.user.storage.mode;

        //getWikiContent(year,month,conv,getEventArray);
        //sayPromise(conv);
        getWikiContent(year,month).then(getEventArray).then(function(promiseArr){
            //console.log("こんぶまできてるよー22222222！");
            //console.log(conv);
            // let date = promiseArr[0][0];
            // let event = promiseArr[1][0];
            let speech = new Speech();
            let text ="";
            speech.say(`わかりました。`);
            text += "わかりました。\n";
            speech.pause('700ms');

            //読み上げ数を設定する
            var introNumber;
            promiseArr[0].length < maxNumber ? introNumber = promiseArr[0].length : introNumber = maxNumber;

            if(mode === "showa"){
                speech.say(`昭和${adToShowaYear(year)}年の${month}月の出来事を${introNumber}件ご案内します。`);
                text += `${adToShowaYear(year)}年の${month}月の出来事を${introNumber}件ご案内します。\n`;
            }else if(mode === "heisei"){
                speech.say(`平成${adToHeiseiYear(year)}年の${month}月の出来事を${introNumber}件ご案内します。`);
                text += `${adToHeiseiYear(year)}年の${month}月の出来事を${introNumber}件ご案内します。\n`;
            }else{
                speech.say(`${year}年の${month}月の出来事を${introNumber}件ご案内します。`);
                text += `${year}年の${month}月の出来事を${introNumber}件ご案内します。\n`;
            }

            speech.pause('1000ms');
            
            //配列の長さからランダムナンバーをmaxNumber(デフォルト3)取り出す
            var randomNumbers = [];
            //読み上げ数分のランダム値を得る
            while (randomNumbers.length < introNumber) {
                var n = Math.floor(Math.random() * promiseArr[0].length);
                //未取得の数値のみ追加する
                if(!randomNumbers.includes(n)){
                    randomNumbers.push(n);
                }
            }
            randomNumbers.sort();

            for (var i = 0; i < introNumber; i++) {
                //promiseArr[0] = Date 
                speech.say(promiseArr[0][randomNumbers[i]]);
                text += `${promiseArr[0][randomNumbers[i]]}\n`;
                speech.pause('1500ms');
                //promiseArr[1] = Event
                speech.say(promiseArr[1][randomNumbers[i]]);
                text += `${promiseArr[1][randomNumbers[i]]}\n`;
                speech.pause('2000ms');
            }

            speech.say("この年の他の月の出来事を聞くことができます。その場合は「1月」のように言ってください。聞かない場合は「聞かない」と言います。");
            text += "この年の他の月の出来事を聞くことができます。その場合は「1月」のように言ってください。聞かない場合は「聞かない」と言います。";
            conv.user.storage.month = null;
            conv.ask(new SimpleResponse({
                speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
                text: text,
            }));
            // conv.ask(new Suggestions('1月'));
            // conv.ask(new Suggestions('聞かない'));
            resolve();
        }).catch(function(){
            let speech = new Speech();
            speech.say(`すみません。記憶の読み取りができませんでした。この年の他の月の出来事を聞くことができます。その場合は「1月」のように言ってください。聞かない場合は「聞かない」と言います。`);
            let text = "すみません。記憶の読み取りができませんでした。この年の他の月の出来事を聞くことができます。その場合は「1月」のように言ってください。聞かない場合は「聞かない」と言います。";
            conv.ask(new SimpleResponse({
                speech: speech.ssml().replace(/<break time='(\d+)ms'\/>/g,'<s><break time=\'$1ms\'/></s>'),
                text: text,
            }));
            // conv.ask(new Suggestions('1月'));
            // conv.ask(new Suggestions('聞かない'));
            resolve();
        });
    });
});

app.intent('pauseTravel',(conv) =>{
    let text = "別の年代を旅する場合は、行きたい年齢または行きたい年代を言ってください。やめる場合は「終わり」と言います。";
    let speech = new Speech();

    //speech.audio("");
    speech.say(text);

    conv.ask(new SimpleResponse({
        speech: speech.ssml(),
        text: text,
    })); 
    // conv.ask(new Suggestions('1950年'));
    // conv.ask(new Suggestions('昭和45年'));
    // conv.ask(new Suggestions('終わり'));
});

app.intent('closeTravel',(conv) => {
    let text = "おかえりなさい。いかがでしたでしょうか。また旅をしたくなったら、いつでも声をかけてくださいね。";
    let speech = new Speech();

    //speech.audio("");
    speech.audio(sounds.ending.url);
    conv.close(new SimpleResponse({
        speech: speech.ssml(),
        text: text,
    }));  
})

//Wikiコンテンツを取得
function getWikiContent(year,month){
    return new Promise((resolve,rejected) => {
        webclient.get({
            url: "https://ja.wikipedia.org/w/api.php",
            qs: {
            format: "json",
            utf8: "",
            action: "query",
            prop: "revisions",
            rvprop:"content",
            titles:`${year}年`
            }
        }, function (error, response, body) {
            console.log(body);
            resolve([JSON.parse(body),month,year]);
        })
    });

}

//天気情報取得
function getWeather(promiseArr){
    return new Promise((resolve,rejected) =>{
        let date = promiseArr[0];
        let events = promiseArr[1];
        let year = promiseArr[2];
        let month = promiseArr[3];
        let day = new Date().getDate();
        let target = weatherUrl + `&year=${year}&month=${month}&day=${day}&view=`;
    
        client.fetch(target , (err, $, res) => {
            //console.dir($('#tablefix1 tr').eq(parseInt(day) + 3).find('td').eq(19).text());
            let weather = $('#tablefix1 tr').eq(parseInt(day) + 3).find('td').eq(19).text();
            if(!weather){
                weather = "記録なし";
            }
            resolve( [date,events,weather]);
        });
    });

}

//Wikiコンテンツ(年)から月ごとの出来事の抜き出し
function getEventArray(promiseArr){
    let content = promiseArr[0];
    let month = promiseArr[1];
    let year = promiseArr[2];

    let pageId = Object.keys(content.query.pages)[0];
    let body = content.query.pages[pageId].revisions[0]["*"]
    //出来事切り出し
    let event = body.match(/== できごと ==[\s\S]*?\n==\s(.*)\s==\n/);
    //出来事の中から1-12月抜き出して配列化
    let months = event[0].match(/[0-9]*月 ===[\s\S]*?(\n\n===|\n===|\n\n==)/g);
    //month月の出来事
    let days = months[month-1].match(/\*(.*?)(\n|\n\n)/g);
    let date = [];
    let events = [];
    days.forEach((el,index) => {
        let [d,e] = el.split(' - ');
        if(d && e){
            date.push(d.replace(/(\[|\]|\*|\s|\n)/g,''));
            e = e.replace(/(\[|\]|\*|\s|\n)/g,'');
            events.push(e.replace(/<ref>.*<\/ref>/g,'').replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,''));
        }
    });
    // let [day,event] = days[0].split(' - ');
    // day = day.replace(/(\[|\]|\*|\s|\n)/g,'');
    // event = event.replace(/(\[|\]|\*|\s|\n)/g,'')
    // for(var i = events.length - 1; i > 0; i--) {
    //     var j = Math.floor(Math.random() * (i + 1));
    //     var [tmpE,tmpD] = [events[i],date[i]];
        
    //     events[i] = events[j];
    //     date[i] = date[j];

    //     events[j] = tmpE;
    //     date[j] = tmpD;

    // }
    return [date,events,year,month];

}

//昭和から西暦へ変換
function showaToAdYear(showa){
    return 1900 + showa + 25;
}

//平成から西暦へ変換
function heiseiToAdYear(heisei){
    return heisei - 12 + 2000;
}

//西暦から昭和へ変換
function adToShowaYear(adYear){
    return adYear - 1925;
}

//西暦から平成へ変換
function adToHeiseiYear(adYear){
    return adYear - 1988;
}

exports.DialogflowFirebaseFulfillmentV2 = functions.https.onRequest(app);