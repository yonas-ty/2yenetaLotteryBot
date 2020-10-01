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

let states = ['init', 'name', 'phone_no', 'photo', 'done'];

let user = {
    id: Math.floor(Math.random() * 90000) + 10000,
    chat_id: '',
    fullname: '',
    phonenumber: '',
    lottonumber: '',
    state: states[0],
    status: ''
}

bot.onText(/\/start/, (msg) => {

    bot.sendMessage(msg.chat.id, "Please Send Me Your Full Name");
    user.chat_id = msg.chat.id;
    db.put(user.id, JSON.stringify(user), function(err) {
        user.state = states[1];
        if (err) return console.log('Err', err)
    });
});

bot.on('message', (msg) => {

    if (user.state == 'name') {
        bot.sendMessage(msg.chat.id, "Your Phone Number:");
        user.fullname = msg.text;
        user.state = states[2];
    } else if (user.state == 'phone_no') {
        bot.sendMessage(msg.chat.id, "Send Me The Reciept of your Payment:");
        user.phoneNumber = msg.text;
        user.state = states[3];

    } else if (user.state == 'photo') {


        user.state = states[4];

        var options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: 'Approve',
                        callback_data: '1'
                    }],
                    [{
                        text: 'Decline',
                        callback_data: '2'
                    }],
                ]
            })
        };
        db.put(user.id, JSON.stringify(user), function(err) {
            bot.sendMessage(msg.chat.id, "Thank You for your participation 😄! we will check and send you your lottery number");
            bot.forwardMessage(config.ADMIN_ID, msg.from.id, msg.message_id);
            bot.sendMessage(config.ADMIN_ID, "Is the reciept valid", options);
            if (err) return console.log('Err', err)
        });

    }

});
bot.on("polling_error", (err) => console.log(err));
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    let user_data;
    db.get(user.id, function(err, value) {
        if (err) return console.log('Ooops!', err)
        user_data = JSON.parse(value);
        if (action === '1') {
            user.lottonumber = Math.floor(Math.random() * 3000) + 1000;
            bot.sendMessage(user_data.chat_id, `
                Dear ${ user_data.fullname } \n Yout Lotto Number is ${ 'B' + user.lottonumber } \nThe Winners will be announced on 10/10/20! \nStay tuned on Our channels and groups `);
        } else {
            bot.sendMessage(user_data.chat_id, 'You are denied');
        }
    })

});





app.listen(config.PORT, function() {
    console.log('Our app is running on http://localhost:' + config.PORT);
});