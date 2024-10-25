import logRegister from "./LogRegister.js"
import axios from 'axios'

class Telegram
{
    Telegram(_token="",_domain="https://api.telegram.org"){
        this.token = _token
        this.domain = _domain
    }

    async sendMessage(userId,message) {
        let body = {
            "chat_id": userId.toString(),
            "text": message
        }

        await logRegister("Telegram.sendMessage(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            let result = await axios.post(domain+"/bot"+token+"/sendMessage",body)

            await logRegister("Telegram.sendMessage(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Telegram.sendMessage(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

    async deleteMessage(chatId,messageIds) {
        console.log("messageIds = "+messageIds)
        if(Array.isArray(messageIds) == false){
            console.log("Array.isArray(messageIds) = "+Array.isArray(messageIds))
            messageIds = [messageIds]
        }
        
        let body = {
            "chat_id": chatId,
            "message_ids": messageIds
        }

        await logRegister("Telegram.deleteMessage(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            let result = await axios.post(domain+"/bot"+token+"/deleteMessages",body)
            
            await logRegister("Telegram.deleteMessage(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Telegram.deleteMessage(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

    async sendContact(chatId="",contactPhone="",firstName="",lastName="") {
        let body = {
            "chat_id":chatId,
            "phone_number":contactPhone,
            "first_name": firstName
        }

        if(lastName!= ""){
            body["last_name"] = lastName
        }
        
        await logRegister("Telegram.sendContact(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            let result = await axios.post(domain+"/bot"+token+"/sendContact", body)

            await logRegister("Telegram.sendContact(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Telegram.sendContact(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

}

export default Telegram