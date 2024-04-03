import {Router} from "express";
import transport from "../email.util.js";
import emailConfig from "../config/email.config.js";

import * as tickets from "../services/ticket.services.js";
import * as recovery from "../services/recovery.services.js";
import * as Users from "../services/user.services.js";
import * as carts from "../services/cart.services.js";
import * as product from "../services/product.services.js";

import session from 'express-session';
import MongoStore from 'connect-mongo';

import {v4 as uuidv4} from "uuid";
import path from 'path';
import { fileURLToPath } from 'url';

import CustomError from "../utils/custom.error.js";
import * as InfoError from "../utils/info.error.js"
import EnumError from "../utils/enum.error.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mailRouter =Router();

mailRouter.get("/:cid",async (req,res)=>{
    try{
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
    const purchase_datetime = new Date().toISOString();
    const code=uuidv4()
    const cart =await carts.getCart(req.session.user.name)
    const amount =cart.total
    const purchaser=req.session.user.name

    const ticket={
        code:code,
        purchase_datetime:purchase_datetime,
        amount:amount,
        purchaser:purchaser
    }

    const from= emailConfig.emailUser;
    const to=req.session.user.email;
    const subject="Su paquete llegará pronto"
    let html =`
        <html>
            <img src="cid:store_icon" width="50"/>
            <h3>${purchase_datetime}</h3>
            <h1> Saludos ${purchaser}</h1>
            <p>Su pedido está listo y llegará pronto, aquí está su recibo</p>
            <div>
            <h2>Codigo</h2>
            ${code}
            <h2>Total</h2>
            $ ${amount}
            </div>
            -Artículos comprados-
        <div>
    `
    for(const item in cart.products){
        html+=`
        <h3>${cart.products[item].name}</h3>
        <p>Costo:${cart.products[item].price}
            Cantidad:${cart.products[item].quantity}</p>
        `
    }
    html+=`</div></html>`
    const email= await transport.sendMail({
        from:from,
        to:to,
        subject:subject,
        html:html,
        attachments:[{
            filename:'store_icon.png',
            path:path.join(__dirname+'/../img/store_icon.png'),
            cid:'store_icon'
        }]
    })



    const newTicket = await tickets.createTicket(ticket)


    const currentCart =await carts.getCart(req.session.user.name)
    const listproducts =await product.getAll()

            for(const pcart in currentCart.products){
                let item=currentCart.products[pcart]
                let find = await product.getByID(item.product)
                for(const iter in listproducts){
                    let curP=listproducts[iter]
                    if(curP.id===find.id){
                        listproducts[iter].stock=curP.stock-item.quantity
                        let result =await product.updateProduct(find._id,listproducts[iter])
                    }
                }
            }



    cart.products=[]
    cart.total=0;

    let result =await carts.emptyCart(cart.id,cart)
    req.logger.debug("Carrito del usuario vaciado")
    res.redirect("/")
    }catch(error){
        req.logger.error(error)
        res.status(501).json({message:error})
    }
})

mailRouter.get("/pass_token/:email&:id",async(req,res)=>{
    const code=uuidv4()
    let email =req.params.email;
    let token =req.params.id

    let link=`http://localhost:3000/recovery/${token}&${code}`

    const datetime = new Date().toISOString();
        const from= emailConfig.emailUser;
        const to=email;
        const subject="Su enlace de recuperación"
        let html =`
            <html>
                <img src="cid:store_icon" width="50"/>
                <h3>${datetime}</h3>
                <h1> Saludos</h1>
                <p>Hemos recibido una solicitud de restablecimiento de contraseña
                por favor siga el enlace para proceder:</p>
                <a href =${link}> Restablecer contraseña ahora</a>
                <p>Este enlace caducará en una hora, si usted no 
                por favor ignore este correo</p>
            </html>
        `
        const email_request= await transport.sendMail({
            from:from,
            to:to,
            subject:subject,
            html:html,
            attachments:[{
                filename:'store_icon.png',
                path:path.join(__dirname+'/../img/store_icon.png'),
                cid:'store_icon'
            }]
        })
    const new_link= await recovery.createRecovery(token,code)
    return res.redirect("/")

})


export default mailRouter;