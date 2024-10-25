import fs from 'node:fs/promises'

async function logRegister(title="",message="",filePath=""){
    try {
        let now = new Date()

        const content = `[${now.toLocaleString("pt-BR")}] -- ${title}\n${message}\n\n`;
        
        //console.log(content)

        await fs.appendFile(process.cwd()+filePath, content);
    } catch (err) {
        console.log(err);
    }
}

export default logRegister