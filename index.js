import logRegister from "./services/LogRegister.js"
import Telegram from "./services/Telegram.js"
import Hubspot from "./services/Hubspot.js"
import Validate from "./services/Validate.js"
import express from "express"
import bodyParser from 'body-parser'
import * as config from './config.json' with { type: "json" }

var app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const { port, logFile } = config.default

const { domain : hubspotDomain, token : hubspotToken } = config.default.hubspot

const { domain : telegramDomain, token : telegramToken, groupId } = config.default.telegram

app.post("/webhook", async function (req, res){
    await logRegister("Webhook Notification",JSON.stringify(req.body),logFile)

    try{
        let telegram = new Telegram(telegramToken, telegramDomain)
        let hubspot = new Hubspot(hubspotToken, hubspotDomain)
        let validate = new Validate()

        const userId= req.body.message.from.id
        const username = req.body.message.from.username
        const messageText = req.body.message.text
        
        //Find on hubspot
        let result = await hubspot.search("contacts","telegram_id",userId.toString(),["firstname","lastname","telegram_id","assinatura_ativa","bot_etapa","phone"])
        let status = result.status
        let data = result.data
        
        if(status ==200){
            if(data.total == 0){
                //ask CPF
                if(!validate.cpf(messageText)){
                    await telegram.sendMessage(userId,"Informe o seu CPF.")
                }else{
                    let resultContactCPF = await hubspot.search("contacts", "cpf", messageText, ["assinatura_ativa"])

                    let statusCPF = resultContactCPF.status
                    let dataCPF = resultContactCPF.data
                    
                    if(statusCPF==200){
                        if(dataCPF.total == 1){
                            let contactId = dataCPF.results[0].id
                            
                            await hubspot.update(
                                contactId,
                                "contacts",
                                [
                                    { "name":"telegram_id", "value": userId.toString() },
                                    { "name":"telegram_username", "value": username }
                                ]
                            )
                            
                            let isUserActive = dataCPF.results[0].properties.assinatura_ativa
                            if(isUserActive != 'sim'){
                                await telegram.sendMessage(userId,"Desculpe, mas a sua assinatura foi encerrada.")
                            }
                            else{
                                await telegram.sendMessage(userId,"O que deseja fazer?\n1. Realizar Pedido\n2. Encerrar Pedido\n3. Negociar com comrpador")
                            }

                        }else{
                            await telegram.sendMessage(userId,"Desculpe, não encontramos o seu CPF.")
                        }
                    }
                }
            }else{
                let contactId = data.results[0].id
                let etapa = data.results[0].properties.bot_etapa
                let firstName = data.results[0].properties.firstname
                let lastName = data.results[0].properties.lastname
                let userPhone = data.results[0].properties.phone
                let isUserActive = data.results[0].properties.assinatura_ativa

                if(isUserActive == "sim") {
                    switch(messageText) {
                        case "1":
                        case "realizar pedido":
                            await hubspot.update(contactId,"contacts",[{"name":"bot_etapa", "value":1}])
                            await telegram.sendMessage(userId,"Descreva de forma clara o que está procurando.")
                            break
                        case "2":
                        case "encerrar pedido":
                            await hubspot.update(contactId,"contacts",[{"name":"bot_etapa", "value":2}])
                            await telegram.sendMessage(userId,"Informe o codigo do pedido que deseja encerrar.")
                            break
                        case "3":
                        case "Negociar com comprador":
                            await hubspot.update(contactId,"contacts",[{"name":"bot_etapa", "value":3}])
                            await telegram.sendMessage(userId,"Informe o codigo do pedido que deseja negociar.")
                            break
                        default:
                            switch(etapa) {
                                case "1":
                                    //save deal
                                    let dealProperties = [
                                        {"name": "dealname", "value": messageText},
                                        {"name": "dealstage", "value": "qualifiedtobuy"},
                                        {"name": "pipeline", "value": "default" }
                                    ]
                                    
                                    let resultDeal = await hubspot.save("deals",dealProperties)
                                    
                                    if(resultDeal.status == 201){
                                        let dealId = resultDeal.data.id
                                        //associate to contact
                                        let resultAssociation = await hubspot.associate(dealId,contactId,3)

                                        if(resultAssociation.status == 204)
                                        {
                                            //send message to group
                                            let resultSendGroup = await telegram.sendMessage(groupId,"codigo: "+dealId+"\nBuscando: "+messageText)
                                            
                                            let message_id = resultSendGroup.data.result.message_id

                                            //update deal with message_id
                                            let resultMessageId = await hubspot.update(dealId,"deals",[{"name":"mensagem_id", "value": message_id}])    
                                            let statusMessageId = resultMessageId.status

                                            if(statusMessageId == 200){
                                                //send message with code to user
                                                await telegram.sendMessage(userId,"seu pedido foi salvo com o codigo "+dealId)
                                            }else{
                                                await telegram.sendMessage(userId,"Infelizmente ocorreu um erro tente novamente mais tarde.")

                                            }
                                        }else{
                                            
                                            await telegram.sendMessage(userId,"Infelizmente ocorreu um erro tente novamente mais tarde.")
                                        }
                                    }
                                    break
                                case "2":
                                    //verify if deal exists or is from user
                                    //ps:. get te message id to
                                    let resultDealFound = await hubspot.search("deals", "hs_object_id", messageText,["mensagem_id"])
                                    let statusDeal = resultDealFound.status
                                    let dataDeal = resultDealFound.data
                                    
                                    if(statusDeal == 200){
                                        if(dataDeal.total !=0){
                                            let messageId = dataDeal.results[0].mensagem_id

                                            //close deal
                                            let resultCloseDeal = await hubspot.update(messageText,"deals",[{"name":"dealstage","value":"closedwon"}])
                                            
                                            let statusCloseDeal = resultCloseDeal.status
                                            if(statusCloseDeal == 200){
                                                //delete messsage on group
                                                await telegram.deleteMessage(groupId,messageId)

                                                await telegram.sendMessage(userId,"O pedido foi encerrado com sucesso.")
                                            }
                                        }
                                        else{
                                            await telegram.sendMessage(userId,"Não encontramos o codigo informado.")
                                        }
                                    }
                                    break
                                case "3":
                                    //let resultDealFound3 = await hubspot.search("deals", "hs_object_id", messageText, ["hs_contact_id"])
                                    let resultDealFound3 = await hubspot.getAssociated("deals",messageText,"contacts")
                                    let statusDeal3 = resultDealFound3.status
                                    let dataDeal3 = resultDealFound3.data
                                    
                                    if(statusDeal3 == 200){
                                        if(dataDeal3.results.length > 0){
                                            let buyerId = dataDeal3.results[0].id

                                            let resultBuyerFound = await hubspot.search("contacts", "hs_object_id", buyerId, ["telegram_id"])
                                            let statusBuyerFound = resultBuyerFound.status
                                            let dataBuyerFound = resultBuyerFound.data

                                            if(statusBuyerFound == 200){
                                                if(dataBuyerFound.total != 0){
                                                    let buyerChatId = dataBuyerFound.results[0].properties.telegram_id
                                                    
                                                    await telegram.sendMessage(buyerChatId,"Um dos membros do grupo deseja negociar com você.")
                                                    await telegram.sendContact(buyerChatId,userPhone,firstName,lastName)
                                                    await telegram.sendMessage(userId,"Enviamos uma notificação para comprador.")
                                                }
                                            }
                                        }
                                        else{
                                            await telegram.sendMessage(userId,"Não encontramos o codigo informado.")
                                        }
                                    }
                                    break
                                case "0":
                                default:
                                    await telegram.sendMessage(userId,"O que deseja fazer?\n1. Realizar Pedido\n2. Encerrar Pedido\n3. Negociar com comrpador")
                                    break
                            }
                            
                            await hubspot.update(contactId,"contacts",[{"name":"bot_etapa", "value":0}])
                            break
                    }
                }else{
                    await telegram.sendMessage(userId,"Infelizmente a sua assinatura foi cancelada.")
                }
            }
        }
    }catch(err){
        //console.log(JSON.stringify(err))
        await logRegister("Webhook(Exception)",JSON.stringify(err),logFile)
        //res.status(400).send(JSON.stringify(err))
        res.send(JSON.stringify(err))
    }

    res.send(req.body)
})

app.listen(port, function () {
    console.log("App de Exemplo escutando na porta "+port+"!")
})
