import {Router} from "express";
import * as product from "../services/product.services.js";
import io from "../app.js";

import CustomError from "../utils/custom.error.js";
import * as InfoError from "../utils/info.error.js";
import EnumError from "../utils/enum.error.js";
import transport from "../email.util.js";
import emailConfig from "../config/email.config.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ProuductRouter = Router();
ProuductRouter.post("/edit_items",async(req,res)=>{
    const{showName,_id,title,description,code,price,stock,imge,category}=req.body;
    try{
        
    if(_id === '' && (showName === "delete" || showName === "true")){
        CustomError.createError({
            name:"Error de producto",
            cause:InfoError.generateProductUpdateErrorInfo(_id),
            message:"Se ha producido un error al actualizar",
            code:EnumError.PRODUCT_ERROR,
        });
        req.logger.warn("Error al actualizar elementos")                
        res.redirect("/api/products/edit_items")
        return;
    }
    if(req.session.user === undefined){
        CustomError.createError({
            name:"Error de sesión de usuario",
            cause:InfoError.generateUserSesErrorInfo(),
            message:"Sesión cerrada",
            code:EnumError.ROUTING_ERROR
        });        
        res.redirect("/")
        return;
    }
    const current_role =req.session.user.role
    let current_email=req.session.user.email
    console.log(current_role)
    if(current_role ==="User" || current_role ==!"ADMIN"){
            console.log("oops")
            return res.status(400).json({message:"NO AUTORIZADO"});        
    }
    if(showName === "delete"){
        try{ 
        const old_info=await product.getByID(_id)
        if(current_role === "premium"){
            if (old_info.owner!==current_email){
                req.logger.warn("Borrado sólo los artículos propios")
                io.emit("NotOwned")
                res.redirect("/api/products/edit_items");
                return ;
            }
        }

        const from= emailConfig.emailUser;
        const to=old_info.owner;
        const subject="Notificación sobre sus artículos"
        let html =`
            <html>
                <img src="cid:store_icon" width="50"/>
                <h3>${new Date()}</h3>
                <h2> Saludos</h2>
                <p>En Maple somos profesionales ayudando a los usuarios con artículos que desean vender</p>
                <p>Lamentablemente, hemos eliminado los siguientes artículos por incumplimiento de las normas del mercado</p>
                </br>
                <img src= ${old_info.thumbnail} width="50" />
                <h2>Item: ${old_info.title}</h2>
                <h3>Descripcion: ${old_info.description} </h3>
                <p>Codigo: ${old_info.code} </br>Precio: ${old_info.price} </br>
                Stock: ${old_info.stock} </br>Categoria: ${old_info.category} </p>
        `        
        
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

        const ID_delete= await product.removeProduct(_id);
        req.logger.debug(`Articulo con ID:${_id} ha sido eliminado`)
        res.redirect("/api/products/edit_items")
        }catch(error){
            CustomError.createError({
                name:"Error de producto",
                cause:InfoError.generateProductUpdateErrorInfo(_id),
                message:"Se ha producido un error con la solicitud, Artículo no encontrado o no se ha podido eliminar",
                code:EnumError.PRODUCT_ERROR,
            });        
            res.redirect("/api/products/edit_items")
            return;
        }
    }
    else if(showName === true || showName === "true"){
        const old_info=await product.getByID(_id)
        if(current_role ==="premium"){
            if (old_info.owner!==current_email){
                req.logger.warn("Editar sólo en el elemento propio")
                io.emit("somethig_wrong")
                res.redirect("/api/products/edit_items");
                return 
            }
        }
        const new_info={
            title:title||old_info.title,
            description:description||old_info.description,
            owner:old_info.owner,
            code:code||old_info.code,
            price:price||old_info.price,
            stock:stock||old_info.stock,
            category:category||old_info.category,
            thumbnail:imge||old_info.thumbnail||"https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png"
        }
        req.logger.debug("El artículo se ha actualizado a: ",new_info)
        const update = await product.updateProduct(_id,new_info)
        res.redirect("/api/products/edit_items")
        return;
    }
    else{
        if(current_role==="ADMIN"){
            current_email="Mapple"
        }
        const new_info={
            title:title||"DummyItem",
            description:description||"Hey es un elemento ficticio",
            owner:current_email ||"NOOK-INC",
            code:code||"DUMMY_ITEM",
            price:price||"69",
            stock:stock||"69",
            category:category||"655b92be363b19dfbd005b5b",
            thumbnail:imge||'https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png'

        }
        req.logger.debug("Se ha añadido el artículo:", new_info);
        const new_item= await product.addProduct(new_info)
        res.redirect("/api/products/edit_items")
        return;
    }}
    catch(error){
        CustomError.createError({
            name:"Error de producto",
            cause:InfoError.generateProductUpdateErrorInfo(_id),
            message:"Se ha producido un error al actualizar",
            code:EnumError.PRODUCT_ERROR,
        });        
        res.redirect("/api/products/edit_items")
        return;
    }
})

ProuductRouter.get("/edit_items",async (req,res)=>{
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

    let page = parseInt(req.query.page);
    if(!page) page=1;
    const products = await product.paginate([{},{page,limit:10,lean:true}])
    products.prevLink = products.hasPrevPage?`http://localhost:3000/api/products/edit_items/?page=${products.prevPage}`:'';
    products.nextLink = products.hasNextPage?`http://localhost:3000/api/products/edit_items/?page=${products.nextPage}`:'';
    products.isValid= !(page<=0||page>products.totalPages)
    const current_user=req.session.user
    res.render('index',{
        layout:'edit_item',products,current_user})
})
ProuductRouter.get("/:id",async (req,res)=>{
    if(req.session.user===undefined){
        CustomError.createError({
            name:"Error de sesión de usuario",
            cause:InfoError.generateUserSesErrorInfo(),
            message:"Sesión cerrada",
            code:EnumError.ROUTING_ERROR
        })        
        res.redirect("/")
        return;
    }
    const {id} =req.params;
    const Product = await product.getByID(id)
    console.log(product)
    res.status(200).json({status:"Sucess",message:Product})
})
ProuductRouter.post("/",async (req,res)=>{
    try{
        
        const productinfo={
            title:req.body.title,
            description:req.body.description,
            owner:req.sessions.user.email||"NOOK-INC",
            price:req.body.price,
            stock:req.body.stock,
            category:req.body.price,
            thumbnail:req.body.thumbnail||"https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png",
            visible:req.body.visible||true
        }
        const newProduct = await product.addProduct(productinfo)
        res.status(200).json({status:"Sucess",message:newProduct})
    }catch(error){
        CustomError.createError({
            name:"Error de producto",
            cause:InfoError.generateProductUpdateErrorInfo(),
            message:"Se ha producido un error al actualizar",
            code:EnumError.PRODUCT_ERROR,
        });        
        res.redirect("/api/products/edit_items")
        return;
    }
})

ProuductRouter.get('/', async (req,res)=>{  
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
        let UDacess
        let current_user=req.session.user;
        let isAdmin =req.session.admin;
        if (current_user.role ==="premium"){
            isAdmin=true
            UDacess=false
        }else if(current_user.role ==="ADMIN"){
            UDacess=true
            isAdmin=true
        }
        io.emit("current_user",current_user);
        let page = parseInt(req.query.page);
        if(!page) page=1;
        let query =req.query
        const value_query =Object.values(query)[0]
        const name_query =Object.keys(query)[0]
        let has_query=false
        let products = await product.paginate([{},{page,limit:10,lean:true}])
        if(name_query==="limit" ){
            has_query=true
            products =await product.paginate([{},{page,limit:value_query,lean:true}]) 
        }
        else if (name_query ==="sort"){
            has_query=true
            if(value_query==="asc"){
                products =await product.paginate([{},{page,limit:10,lean:true,sort:{price:1}}])
            }else{products =await product.paginate([{},{page,limit:10,lean:true,sort:{price:-1}}])
            }
        }
        else if (Object.values(query).length>=2){
            has_query=true
            products = await product.paginate([query,{page,limit:10,lean:true}])
        }
        else if (name_query ==="category"){
            products = await product.paginate([query,{page,limit:10,lean:true}])
        }
        else{
            has_query=false
            products = await product.paginate([{},{page,limit:10,lean:true}])
        }
        if (has_query){
            products.prevLink = products.hasPrevPage?`http://localhost:3000/api/products/?${name_query}=${value_query}&page=${products.prevPage}`:'';
            products.nextLink = products.hasNextPage?`http://localhost:3000/api/products/?${name_query}=${value_query}&page=${products.nextPage}`:'';
        }else{
        products.prevLink = products.hasPrevPage?`http://localhost:3000/api/products/?page=${products.prevPage}`:'';
        products.nextLink = products.hasNextPage?`http://localhost:3000/api/products/?page=${products.nextPage}`:'';}
        products.isValid= !(page<=0||page>products.totalPages)
        res.render('index',{
                layout:'products'
                ,products,current_user,isAdmin,UDacess})

    }catch(error){res.status(500).json({message:error.message})}

})

export {ProuductRouter};