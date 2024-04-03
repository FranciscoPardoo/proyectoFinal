import {Router} from "express";

const router =Router();

router.get("/",(req,res)=>{
    try{
    req.logger.debug("Sólo los desarrolladores pueden ver este mensaje de depuración");
    req.logger.http("Sólo los desarrolladores pueden ver este mensaje Http");
    req.logger.info("Info mensaje");
    req.logger.warn("Mensaje de advertencia");
    req.logger.error("ENVÍO DE MENSAJE DE ERROR AL REGISTRADOR");
    req.logger.fatal("FATAL ERROR ☢️")
    res.json({message:"Saludos"})
}
    catch(error){
        console.log(error)
    }
})

export default router;