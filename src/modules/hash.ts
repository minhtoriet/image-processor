import bcrypt from 'bcrypt';

export async function hashPassword(password:string){
    const hashedPass = await bcrypt.hash(password, 8);
    return hashedPass;
}

export async function checkPassword(candidatePassword:string,hashedPass:string){
    const match = await bcrypt.compare(candidatePassword, hashedPass);
    if (match) {
        return true;
    }
    else return false;
}
