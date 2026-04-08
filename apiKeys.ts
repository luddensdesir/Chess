const tryRequire = require("try-require");

let config;

if( ((process.env.HEROKU || process.env.AWS) === "true") || (__dirname.indexOf("build")!= -1) ){
    const env = process.env; 
    config = {
        cookieSecret: env.COOKIE_SECRET,
        curEnv: "production",
        aes:{
            secret: env.AES_SECRET,
            pass: env.AES_PASS
        },
        user:{
            secret: env.JWT_SECRET
        },
        dbCreds: {
            mongoUser: env.mongoUser, 
            prodUrl: env.prodUrl,
            mongoPassword: env.mongoPassword,
            devUrl: "mongodb://127.0.0.1:27017/chess"
        }
    };

} else {
    var url = __dirname + "/localconfig";
    if(tryRequire.resolve(url)){
        config = require(url);
    }

    // console.log(tryRequire.lastError());
}

export {config};