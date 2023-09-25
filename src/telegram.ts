import got from "got";
import { parse } from 'node-html-parser';
import {TemplatedApp} from "uWebSockets.js";

export default class Telegram{
    ws
    constructor(server:TemplatedApp){
        this.ws = server
    }

    async getRedirect(url:string){
        const response = await got.get(url, {
            headers:{
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
            }, 
            throwHttpErrors: false,
            followRedirect:false
        })
        return response.headers['location']!
    }

    async waitForCode(){
        console.log("Waiting for code")
        while(true){
            const response = await got.get("https://t.me/s/Salesaholic", {
                headers:{
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
                }, 
                throwHttpErrors: false
            })
            const html = parse(response.body)
            const messages = html.querySelectorAll('.tgme_widget_message_wrap.js-widget_message_wrap')
            const message = messages[messages.length-1].querySelector('.tgme_widget_message_text.js-message_text')?.rawText
            if(message){
                if(message.length == 8)
                    return message
            }
        }
    }
    async fetch(){
        let lastText = ''
        while(true){
            try{
                const response = await got.get("https://t.me/s/Salesaholic", {
                    headers:{
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
                    }, 
                    throwHttpErrors: false
                })

                const html = parse(response.body)
                const messages = html.querySelectorAll('.tgme_widget_message_wrap.js-widget_message_wrap')
                const message = messages[messages.length-1].querySelector('.tgme_widget_message_text.js-message_text')?.rawText.replace('code:', 'code').replace(';','')
                if(message){
                    if(message != lastText){
                        const callMessage = {
                            asin:"",
                            discount: -1,
                            codes: '',
                            url: '',
                            lightning: false,
                            clipCoupon:false,
                            time:Date.now()
  
                        }
                        const percentIndex = message.indexOf('%')
                            
                            if(percentIndex != -1 || message.toLowerCase().includes('free')){
                                if(message.includes('amzn.to/') && message.includes('(1)') == false){
                                    try{
                                        if(percentIndex != -1){
                                            callMessage.discount = Number(`${message.charAt(percentIndex-2)}${message.charAt(percentIndex-1)}`)
                                        }
                                        if(message.toLowerCase().includes('free')){
                                            callMessage.discount = 100
                                        }
                                        const code = message.split('code')[1]
                                        if(code && message.toLowerCase().includes('no code') == false && message.toLowerCase().includes('no promo') == false){
                                            callMessage.codes = code.trim().substring(0, 8)
                                            if(callMessage.codes.includes('http')){
                                                callMessage.codes = await this.waitForCode()
                                            }
                                        }
                                        callMessage.url = await this.getRedirect(`https://amzn.to/${message.split('amzn.to/')[1].substring(0,7)}`)
                                        if(callMessage.url.includes('product/')){
                                            callMessage.asin = callMessage.url.split('product/')[1].substring(0,10)
                                        }else if(callMessage.url.includes('dp/')){
                                            callMessage.asin = callMessage.url.split('dp/')[1].substring(0,10)
                                        }
                                        if(message.toLowerCase().includes('lightning') || message.includes('LD')){
                                            callMessage.lightning = true
                                        }

                                        if(message.toLowerCase().includes('clip') || message.includes('coupon')){
                                            callMessage.clipCoupon = true
                                        }

                                        console.log(callMessage)
                                        console.log(message)
                                        this.ws.publish(
                                            "freebies",
                                            JSON.stringify(callMessage)
                                        );
                                    }catch(err){
                                        console.log(err)
                                    }
                            }
                        }
                        lastText = message
                    }
                }
            }catch{
                console.log('Limit error')
            }
        }
    }
}

