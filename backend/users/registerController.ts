import UserData from "../dataAccess/users";
import * as helper from "../utils/jwtHelper";
// import {config} from "../../localconfig";
import {config} from "../../apiKeys";
import {l, n} from "../utils/misc";
const curEnv = config.curEnv;
const dev = (curEnv === "development");

const registerController = ()=>{
  const register = async (req, res) =>{
    const newUser = {
          email: req.body.email,
          username: req.body.username,
          password: req.body.password,
          token: ""
      };
    
    // UserData.getUserByEmail(newUser.email, (getUserErr, resUser)=>{
    UserData.checkExistingUser(newUser.email, newUser.username, (getUserErr, resUser)=>{
      if(n(getUserErr)){
      } else {
        // tr(getUserErr);
        res.status("500").send({data:"Error getting user"});
      }
      
      if(n(resUser)) {
        UserData.registerUser(newUser, (registerErr, registeredUser)=>{
          if(n(registerErr)){
            if(!n(registeredUser)){
              const token = helper.getLoginToken(newUser.username);
              const expiryTime = Date.now() + (dev?360000:3600000);

              res.cookie("expiryTime", 
                expiryTime, 
                {expires: new Date(expiryTime),
                  secure: !dev,
                  httpOnly: false,
                });

              res.cookie("token", 
                token,
                {expires: new Date(expiryTime),
                  secure: !dev,
                  httpOnly: true,
                });
  
              res.cookie("loggedIn", 
                true, 
                {expires: new Date(expiryTime),
                  secure: !dev,
                  httpOnly: false,
                });

                // utils.l(registeredUser);
                // e(err, tr(10));

              console.log("successful registration");
              res.status("200").send({data: "register success"});
            } else {
              console.log("fail");
              res.status("500").send({ data: "registration failed"});
            }
          } else {
              console.log("fail");
              res.status("500").send({ data: "registration failed" });
          }
        });
      } else {
        l("User already defined");
        res.status("204").send({data:"user is already defined"});
      }
    });
  };

  return {
    register
  };
};


export default registerController();