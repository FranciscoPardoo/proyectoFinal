import express from "express";
import * as recovery from "../../services/recovery.services.js";
const router = express.Router();

router.get("/", (req, res) => {
  let data = {
    layout: "recoveryrequest",
  };
  res.render("index", data);
});
router.get("/:cid&:code",async(req,res)=>{
  try{
    const {cid,code} =req.params
    console.log(code)
    let check_id=await recovery.getRecovery(req.params.cid,req.params.code);
    if (!check_id){
      req.logger.warn("Token no existe")
      return res.redirect("/recovery");
    }
    let token_date=check_id.createDate.getDay();
    let token_hours=check_id.createDate.getHours();
    const now =new Date()
    let now_hour=now.getHours();
    let now_date=now.getDay();
    if(now_hour > expiring || now_date > token_date){
      req.logger.warn("Token caducado, inténtelo de nuevo")
      let destroy = await recovery.deleteToken(req.params.cid)
      return res.redirect("/recovery")
    }
    if(!check_id){
      req.logger.error("Token no encontrado")
      return res.redirect("/recovery")
    }else{
      req.logger.info("Token existe cargando")
      let data ={
        layout:"resetpass",
        cid:`${req.params.cid}`
      }
      res.render("index",data)}
}
  catch(error){console.log(error)}
})

export default router;