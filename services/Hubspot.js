import logRegister from "./LogRegister.js"
import axios from 'axios'
import fs from 'node:fs/promises'

class Hubspot
{
    Hubspot(_token="",_domain="https://api.hubapi.com"){
        this.token = _token
        this.domain = _domain
    }
    
    async search(object,propertySearch,value,propertiesReturned) {
        let body = {
            "properties": propertiesReturned,
            "limit": 1,
            "filterGroups": [
                {
                    "filters": [
                        { "propertyName": propertySearch, "operator": "EQ", "value": value }
                    ]
                }
            ]
        }
        
        await logRegister("Hubspot.Search(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            let result = await axios.post(domain+"/crm/v3/objects/"+object+"/search",
                body,
                {
                    headers:{
                        'Content-Type':'application/json',
                        'authorization': 'Bearer '+token
                    }
                }
            )
            await logRegister("Hubspot.Search(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Hubspot.Search(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

    async update(id,object="",properties=[{"name":"","value":""}]) {
        let body = {
            "properties": { }
        }

        properties.forEach(property => {
            body.properties[property.name] = property.value
        })

        await logRegister("Hubspot.Update(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            result = await axios.patch(
                domain+"/crm/v3/objects/"+object+"/"+id,
                body,
                {
                    headers: {
                        'Content-Type':'application/json',
                        'authorization': 'Bearer '+token
                    }
                }
            )
            
            await logRegister("Hubspot.Update(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Hubspot.Update(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

    async save(object="",properties=[{"name":"","value":""}]) {
        let body = {
            "properties": { }
        }

        properties.forEach(property => {
            body.properties[property.name] = property.value
        })

        await logRegister("Hubspot.Save(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            let result = await axios.post(
                domain+"/crm/v3/objects/"+object,
                body,
                {
                    headers: {
                        'Content-Type':'application/json',
                        'authorization': 'Bearer '+token
                    }
                }
            )
            
            await logRegister("Hubspot.Save(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Hubspot.Save(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

    async associate(fromObjectId,toOBjectId,definitionId=3) {
        let body = {
            "fromObjectId": fromObjectId,
            "toObjectId": toOBjectId,
            "category": "HUBSPOT_DEFINED",
            "definitionId": 3
        }

        await logRegister("Hubspot.Associate(Request)",`body: ${JSON.stringify(body)}`,logFile)
        try{
            result = await axios.put(
                domain+"/crm-associations/v1/associations",
                body,
                {
                    headers: {
                        'Content-Type':'application/json',
                        'authorization': 'Bearer '+token
                    }
                }
            )
            
            await logRegister("Hubspot.Associate(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Hubspot.Associate(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }

    async getAssociated(object,id,objectAssociated) {
        const url = `${domain}/crm/v3/objects/${object}/${id}/associations/${objectAssociated}/`

        await logRegister("Hubspot.GetAssociated(Request)",`url: ${url}`,logFile)
        try{
            result = await axios.get(url,
                {
                    headers: {
                        'Content-Type':'application/json',
                        'authorization': 'Bearer '+token
                    }
                }
            )
            
            await logRegister("Hubspot.GetAssociated(Result)",`status: ${result.status}\ndata: ${JSON.stringify(result.data)}`,logFile)

            return result
        }catch(err){
            await logRegister("Hubspot.GetAssociated(Exception)",`status: ${err.status}\nmessage: ${JSON.stringify(err.message)}`,logFile)
            
            return {"status": err.status,"data": err.message}
        }
    }
}

export default Hubspot