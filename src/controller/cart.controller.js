import {Router} from "express";
import * as carts from "../services/cart.services.js"
import * as users from "../services/user.services.js"

import CustomError from "../utils/custom.error.js";
import * as InfoError from "../utils/info.error.js"
import EnumError from "../utils/enum.error.js";

const cartRouter = Router();

cartRouter.get("/",async (req, res)=>{

    if(req.session.user === undefined){
        CustomError.createError({
            name:"Error de sesión de usuario",
            cause:InfoError.generateUserSesErrorInfo(),
            message:"Sesión cerrada",
            code:EnumError.ROUTING_ERROR
        });
        req.logger.warn("La sesión ha expirado, redirigiendo")        
        res.redirect("/")
        return;
    }
    try{
        if(req.session.user.role=="ADMIN"){
            return res.status(404).json({message:"LOS ADMINISTRADORES NO TIENEN CARRITOS"})
        }
        const current_id =req.session.user._id
        res.redirect(`/api/cart/${current_id}`)

    }catch(error){
        res.status(501).json({message:error.message})
    }
})
cartRouter.get("/:cid",async(req,res)=>{
    try{
        if(req.params.cid === undefined){
            return res.redirect("/api/products")
        }
    if(req.session.user === undefined){
        CustomError.createError({
            name:"Error de sesión de usuario",
            cause:InfoError.generateUserSesErrorInfo(),
            message:"Sesión cerrada",
            code:EnumError.ROUTING_ERROR
        });        
        return res.redirect("/")
        ;
    }
    if(req.params.cid === "ticket"){
        return res.redirect("/api/cart/ticket")
    }
    const current_user =await users.getbyID(req.params.cid)
    const user_name=current_user.name
    if(current_user.id!==req.session.user._id){
        return res.status(500).json({message:"Acceso no autorizado"})
    }
    const cart= await carts.getCart(user_name)
    const products = cart.products
    res.render('index',{
        layout:'cart'
        ,cart,current_user})
    }catch(error){
        CustomError.createError({
            name:"Error de sesión de usuario",
            cause:InfoError.generateRoutingErrorInfo(),
            message:"Acceso denegado",
            code:EnumError.ROUTING_ERROR
        });        
        res.redirect("/")
    }
})
cartRouter.get("/:cid/payment",async(req,res)=>{
    if(req.session.user === undefined){
        CustomError.createError({
            name:"Error de sesión de usuario",
            cause:InfoError.generateRoutingErrorInfo(),
            message:"Acceso denegado",
            code:EnumError.ROUTING_ERROR
        });        
        res.redirect("/")
        return;
    }
    if(req.params.cid === "undefined"){
        return res.redirect("/api/products")
    }
    const params=req.params.cid
    const current_user =await users.getbyID(params)
    const user_name=current_user.name
    const cart= await carts.getCart(user_name)
    const products = cart.products
    req.logger.http("Proceder a la transacción de artículos")
    res.render('index',{
        layout:'payment'
        ,cart})
})

export default cartRouter;