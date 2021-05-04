//COVID TELEGRAM CHATBOT
/*
This bot lets users interact to find the covid data of various states in India
*/ 
//Telegram bot initialization 
var Tbot=require('node-telegram-bot-api');//Telegram bot api package
var token="1796132438:AAFNmP-PAtQwUV1th1PoyQQya7waE9QbrQI"//Telegram bot token key
var bot=new Tbot(token, {polling: true});//Telegram bot init

//Request package initialization
var request = require("request")
const CovidApi='https://api.apify.com/v2/key-value-stores/toDWvRj1JpTXiM8FF/records/LATEST?disableRedirect=true'//Covid data Api

//firebase firestore initialization
const admin = require('firebase-admin');
var serviceAccount = require("./key.json");//firestore collection key(local file,not present in this github repository)
//This file does not work without the key file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//Variables for time
var db = admin.firestore();
var today=new Date()
var curr_date= today.getDate()+"-"+today.getMonth()+"-"+today.getUTCFullYear()+
    " | "+today.getUTCHours()+":"+today.getMinutes()+":"+today.getUTCSeconds()+" UTC"

//Function to be executed on receiving a message
bot.on("message",function(message_data){
    console.log("\nReceived message from:"+message_data.chat.first_name+
        "\nMessage:"+message_data.text+
        "\nReceived at:"+curr_date )
    if(message_data.text=="/start"){//default initial messsage
        bot.sendMessage(message_data.chat.id,
            "Hello! "+message_data.chat.first_name+
            "\nThis bot can help you find covid details in your state,"+
            "\nPlease input a state name to know covid details"+
            "\n/history:To view personal search history"+
            "\n\n/clrHistory:To clear history"+
            "\n\n/help:For help")
    }
    else if(message_data.text=="/help" ){//help message
        bot.sendMessage(message_data.chat.id,
            "Please input a state name to know covid details"+
            "\n\n/history:TO CHECK RECENT SEARCHES"+
            "\n\n/clrHistory:TO CLEAR HISTORY")
    }

    request(CovidApi, function (error, response, body) {//request to fetch data from Covid Api
        var flag=false;
        for (let index = 0; index < JSON.parse(body).regionData.length; index++) {
            if(message_data.text.toLowerCase() == JSON.parse(body).regionData[index].region.toLowerCase()){    
                bot.sendMessage(message_data.chat.id,
                    message_data.text+
                    ":\nNew cases: "+JSON.parse(body).regionData[index].newInfected+
                    "\nTotal cases: "+JSON.parse(body).regionData[index].totalInfected
                )
                //Adding data to database
                db.collection('CovidSearches').doc(message_data.chat.id+"|"+message_data.message_id).set({
                    chat_id:message_data.chat.id,
                    message_id:message_data.message_id,
                    message_time:curr_date,
                    fname:message_data.chat.first_name,
                    state:message_data.text,
                    total:JSON.parse(body).regionData[index].totalInfected
                },{merge:true});
                flag=true;
                break;
            }   
        }
        if(message_data.text=="/history"){//to show history from database
            db.collection('CovidSearches').where("fname","==",message_data.chat.first_name).get().then(function(docs){
                docs.forEach(function(doc){
                    bot.sendMessage(message_data.chat.id,
                        "RECENT SEARCHES:"+
                        "\nUserName:"+doc.data().fname+
                        "\nSearched state:"+doc.data().state+
                        "\nTotal cases(history):"+doc.data().total+
                        "\nSearch time: "+doc.data().message_time
                    )
                })
            })
            flag=true;
        }
        else if(!flag && !(message_data.text=="/start" || message_data.text=="/help" || message_data.text=="/history")){
            bot.sendMessage(message_data.chat.id,"INVALID INPUT,for press-> /help")
        }
    });
    
})