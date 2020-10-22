var config = require('./config.js');
var express = require('express');
const Bot = require('node-telegram-bot-api');
var http = require('https');
var path = require('path');
const { stat } = require('fs');
var level = require('level')
var db = level('my-db')
var app = express();
const bot = new Bot(config.TOKEN, { polling: true });
var firebase = require('firebase');
var admin = require('firebase-admin');
let states = ['init', 'name', 'phone_no', 'photo', 'done'];

const user = {
    id: Math.floor(Math.random() * 90000) + 10000,
    chat_id: '',
    fullname: '',
    phonenumber: '',
    lottonumber: '',
    state: states[1],
    status: ''
};

firebase.initializeApp(config.FIREBASE_CONFIG);
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});
const firestore = firebase.firestore();
const settings = { timestampsInSnapshots: true};
firestore.settings(settings);
var firebase_db = firebase.firestore();

bot.onText(/\/start/, (msg) => {
   
    bot.sendMessage(msg.chat.id, "Please Send Me Your Full Name");
    user.chat_id = msg.chat.id;
    
    db.put(user.chat_id, JSON.stringify(user), function(err) {
        user.state = states[1];
        db.put(user.chat_id, JSON.stringify(user), function(err) {});
        if (err) return console.log('Err', err)
    });
});

bot.on('message', (msg) => {
    db.get(msg.chat.id, function(err, value) {
        if(value) {
        let user_data = JSON.parse(value);
            console.log(user_data);
        if (user_data.state == 'name') {
        bot.sendMessage(msg.chat.id, "Your Phone Number:");
        user_data.fullname = msg.text;
        user_data.state = states[2];
        db.put(msg.chat.id, JSON.stringify(user_data), function(err) { });
    } else if (user_data.state == 'phone_no') {
        bot.sendMessage(msg.chat.id, "Send Me The Reciept of your Payment:");
        user_data.phoneNumber = msg.text;
        user_data.state = states[3];
        db.put(msg.chat.id, JSON.stringify(user_data), function(err) { });
    } else if (user_data.state == 'photo') {


        user_data.state = states[4];
        
        var options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: 'Approve',
                        callback_data: `{ "user": ${msg.chat.id}, "state": "1" }`
                    }],
                    [{
                        text: 'Decline',
                        callback_data: `{ "user": ${msg.chat.id}, "state": "2" }`
                    }],
                ]
            })
        };
        db.put(msg.chat.id.id, JSON.stringify(user_data), function(err) {
            bot.sendMessage(msg.chat.id, "Thank You for your participation 😄! we will check and send you your lottery number");
            setTimeout(() => {
                bot.forwardMessage(config.ADMIN_ID, msg.from.id, msg.message_id);
                bot.sendMessage(config.ADMIN_ID, `Is the reciept valid? from ${user_data.fullname}`, options);
            },2000);
            if (err) return console.log('Err', err)
        });

    }
}
}); 
});
bot.on("polling_error", (err) => console.log(err));
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = JSON.parse(callbackQuery.data);
    const msg = callbackQuery.message;
    let user_data;
    db.get(user.id, function(err, value) {
        if (err) return console.log('Ooops!', err)
        user_data = JSON.parse(value);
        if (action.state === '1') {
            user_data.lottonumber = Math.floor(Math.random() * 3000) + 1000;
            user_data.lottonumber = 'B' + user_data.lottonumber;
            bot.sendMessage(user_data.chat_id, `Hey ${ user_data.fullname } ,\nYour Lotto Number is ${ user_data.lottonumber } \nWinners will be announced soon on our social medias! `);
            bot.sendMessage(user_data.chat_id, 'Follow us on\nTelegram: https://t.me/raclewetboard\nFacebook: https://www.fb.com/RcLewet/\nInstagram: http://instagram.com/rclewet\nTwitter: http://twitter.com/rclewet\n');
            firebase_db.collection('soldtickets').doc(user_data.fullname + user_data.chat_id).set(user_data);
            bot.sendMessage(config.ADMIN_ID, `loto number sent to ${user_data.fullname}`)

        } else {
            bot.sendMessage(user_data.chat_id, 'Please pay for the lottery and try again.');
        }
    })

});


setInterval(function() {
    var res = http.get('https://toyenetabot.herokuapp.com/');
},30000);


app.listen(config.PORT, function() {
    console.log('Our app is running on http://localhost:' + config.PORT);
});