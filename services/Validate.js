class Validate
{
    cpf(cpf){
        if(isNaN(cpf) == true){
            return false
        }else{
            return cpf.length==11
            //5513998070619
        }
    }
    
    phone(phone){
        if(isNaN(phone) == true){
            return false
        }else{
            return phone.length==13
        }
    }
}

export default Validate