const jwt = require('jsonwebtoken');

function secreteKey(){
return secrete_key = "Divyanshu";
}
const curr_secretkey= secreteKey();
const generate_token = (id)=>{
    return jwt.sign({id},curr_secretkey, {expiresIn: "1d"});
};
// console.log(generate_token(100));
module.exports = { generate_token , secreteKey };