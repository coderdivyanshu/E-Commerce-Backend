const jwt = require('jsonwebtoken');

function secreteKey(){
return secrete_key = "Divyanshu";
}
const curr_secretkey= secreteKey();
const generateRefresh_token = (id)=>{
    return jwt.sign({id},curr_secretkey, {expiresIn: "3d"});
};
// console.log(generate_token(100));
module.exports = { generateRefresh_token , secreteKey };