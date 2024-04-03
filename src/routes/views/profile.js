import express from "express";
import io from "../../app.js";
import CustomError from "../../utils/custom.error.js";
import * as InfoError from "../../utils/info.error.js";
import EnumError from "../../utils/enum.error.js";

const router = express.Router();

router.get("/", (req, res) => {
  try{
  if(req.session.user===undefined){
    CustomError.createError({
      name:"Error de sesión de usuario",
      cause:InfoError.generateUserSesErrorInfo(),
      message:"Sesión cerrada",
      code:EnumError.ROUTING_ERROR
    });        
    res.redirect("/")
    return;
}
  let data = {
    layout: "profile",
    user: req.session.user,
  };
  let email =req.session.user.email;
  req.logger.debug("Current user "+email)
  io.emit("current_user",req.session.user);
  res.render("index", data);}
  catch(error){
    console.log(error)
    return
  }
});

export default router;