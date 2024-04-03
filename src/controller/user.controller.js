import { Router } from "express";
import * as Users from "../services/user.services.js";
import * as Cart from "../services/cart.services.js";
import * as recovery from "../services/recovery.services.js";
import transport from "../email.util.js";
import emailConfig from "../config/email.config.js";
import CustomError from "../utils/custom.error.js";
import * as InfoError from "../utils/info.error.js";
import EnumError from "../utils/enum.error.js";
import "dotenv/config.js";
import { createHash, isValidPassword, uploader } from "../utils.js";
import io from "../app.js";
import { authToken, authorization, generateToken, passportCall } from "../utils.js";
import { logger } from "../logger/dev.logger.js";
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UserRouter = Router();

UserRouter.get("/", async (req, res) => {
    try {
        if (req.session.user === undefined) {
            CustomError.createError({
                name: "Error de sesión de usuario",
                cause: InfoError.generateUserSesErrorInfo(),
                message: "Sesión cerrada",
                code: EnumError.ROUTING_ERROR
            });
            return res.redirect("/");
        }
        if (req.session.user.role !== "ADMIN") {
            return res.redirect("/api/products/");
        }
        const page = parseInt(req.query.page) || 1;
        const isAdmin = req.session.admin;
        const current_user = req.session.user;
        const users = await Users.paginate({}, { page, limit: 10, lean: true });
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();

        for (const usr of users.docs) {
            const lastLog = usr.last_connection;
            const lastMonth = lastLog.getMonth();
            const daysDifference = currentDate.getDate() - lastLog.getDate();

            usr.inactive = !(currentMonth === lastMonth && daysDifference < 2);

            users.prevLink = users.hasPrevPage ? `http://localhost:3000/api/users/?page=${users.prevPage}` : '';
            users.nextLink = users.hasNextPage ? `http://localhost:3000/api/users/?page=${users.nextPage}` : '';
            users.isValid = !(page <= 0 || page > users.totalPages);
        }

        res.render('index', {
            layout: 'users',
            users,
            current_user,
            isAdmin
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});

UserRouter.get("/delete/:uid", async (req, res) => {
    try {
        if (req.session.user === undefined || req.session.user.role !== "ADMIN") {
            return res.redirect("/api/products/");
        }
        const isAdmin = req.session.admin;
        const current_user = req.session.user;
        const users = await Users.getbyID(req.params.uid).toJSON();
        res.render('index', {
            layout: 'delete',
            users,
            current_user,
            isAdmin
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});

UserRouter.post("/delete/:uid", async (req, res) => {
    try {
        console.log("attempting");
        if (req.session.user.role !== "ADMIN") {
            return res.redirect("/api/products/");
        }
        const from = emailConfig.emailUser;
        const user = await Users.getbyID(req.params.uid);
        const to = user.email;
        const subject = "Su cuenta ha sido desactivada por inactividad";
        const html = `
            <html>
                <img src="cid:store_icon" width="50"/>
                <h3>${new Date()}</h3>
                <h1> Saludos ${user.name}</h1>
                <p>Este es un correo electrónico que le notifica que su cuenta ha sido eliminada debido a la inactividad</p>
                <p>Por favor, póngase en contacto con el servicio de atención al usuario para cualquier información adicional o puede registrarse libremente de nuevo con nosotros </p>
            </html>`;

        const email = await transport.sendMail({
            from: from,
            to: to,
            subject: subject,
            html: html,
            attachments: [{
                filename: 'store_icon.png',
                path: path.join(__dirname, '/../img/store_icon.png'),
                cid: 'store_icon'
            }]
        });

        const result = await Users.deleteUser(req.params.uid);
        res.status(201).redirect("/api/users/");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});


UserRouter.get("/edit/:uid",async (req,res)=>{
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
if(req.session.user.role!=="ADMIN"){
    return res.redirect("/api/products/")
}
const isAdmin =req.session.admin;
const current_user=req.session.user;
let users =(await Users.getbyID(req.params.uid)).toJSON()
res.render('index',{
    layout:'edit_user'
    ,users,current_user,isAdmin})

})

UserRouter.post("/edit/:uid",async (req,res)=>{
if(req.session.user.role!=="ADMIN"){
    return res.redirect("/api/products/")
}
let result = await Users.editUser(req.params.uid,{"role":req.body.selectpicker})
res.status(200).redirect(`/api/users/edit/${req.params.uid}`)
})

UserRouter.post("/register",async (req,res)  => {
const { name,last_name, email,age,password } = req.body;
    try {
    if (!name || !email || !password){
    CustomError.createError({
        name:"Error de creación de usuario",
        cause:InfoError.generateUserRegErrorInfo({name,last_name,email,age}),
        message:"Error al crear el usuario",
        code:EnumError.USER_ERROR
    });
    res.redirect("/register");
    return;
    }
    let user = await Users.getUser(email);
    if (user) {
        CustomError.createError({
        name:"Error de creación de usuario",
        cause:"El usuario ya existe en la base de datos",
        message:"Error al crear el usuario",
        code:EnumError.USER_ERROR
        });       
        return res.status(500).json({message:"Error, usuario ya registrado"});
    }else{
    const today = new Date();
    const birthYear = parseInt(age.substring(0, 4));
    const currentYear = today.getFullYear();
    const current_age = currentYear - birthYear;
    if(current_age< 18){
        CustomError.createError({
        name:"Error de creación de usuario",
        cause:InfoError.generateUserAgeErrorInfo(),
        message:"Error al crear el usuario",
        code:EnumError.USER_ERROR
        });
        return res.status(501).json({message:"El usuario debe ser mayor de 18 años",age:current_age})
    }

    const newCart = await Cart.addCart(name)
    const newUser = {
        name,
        last_name,
        email,
        age:current_age,
        password: createHash(password),
        cart_id:newCart._id,
        role:"user",
        documents:[],
    };
    let result = await Users.addUser(newUser)
    req.logger.debug("Éxito Crear usuario")
    res.redirect("/login")}
    } catch (error) {
    req.logger.error(error)
    res.redirect("/register")
    }
});


UserRouter.get("/current", async (req,res) =>{
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
    if(req.session.user.role=="ADMIN"){
    return res.redirect("/api/products/")
    }
    
    let documents = await Users.check_files(req.session.user._id)
    console.log(documents)
    let DestinyPath
    let flag =0
    console.log(documents.length)
    if(documents.length<=0){
    DestinyPath=false
    }
    else{
    for(const doc of documents){
        DestinyPath=path.join(doc.reference,doc.filename)
        if(fs.existsSync(DestinyPath)){
        flag+=1;
        }
    }
    console.log(flag)
    if(flag>3){
        DestinyPath=true
        
    }else{
        DestinyPath =false
        }
    }

    let user_data=req.session.user
    if(user_data.role ==="premium"){
    DestinyPath=true
    }
    if(req.session.user.role=="ADMIN"){
    return res.redirect("/api/products/")
    }
    let data = {
    layout: "profile",
    user: user_data,
    paths:DestinyPath
    };
    io.emit("current_user",user_data);
    res.render("index", data);
})


UserRouter.get("/premium/:uid",async (req,res)=>{
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
if(req.session.user.role=="ADMIN"){
return res.redirect("/api/products/")
}
let documents = await Users.check_files(req.session.user._id)
let uid= req.params.uid;
    let DestinyPath
    let flag =0
    for(const doc of documents){
    DestinyPath=path.join(doc.reference,doc.filename)
    if(fs.existsSync(DestinyPath)){
        flag+=1;
    }
    }
    if(flag>3){
    DestinyPath=true
    }else{DestinyPath =false}

if(DestinyPath===false){
    await Users.premuser(uid,"user");
    req.session.user.role="User"
    return res.status(500).redirect("/api/users/current/")
}

let user_data=req.session.user
let premium=req.session.user.role==="premium"
    let data = {
    layout: "premium",
    user: user_data,
    premium:premium,
    };
    res.render("index",data);}
    catch(error){
    console.log(error);
    return
    }
})

UserRouter.post("/premium/:uid",async (req,res)=>{
let uid= req.params.uid;
let current_role=req.session.user.role
if(req.session.user.role=="ADMIN"){
    return res.redirect("/api/products/")
}
if(current_role==="premium"){
    await Users.premuser(uid,"user");
    req.session.user.role="User"
    return res.redirect(`/api/users/current`)
}else{
    await Users.premuser(uid,"premium");
    req.session.user.role="premium"
    return res.redirect(`/api/users/current`) 
}
})

UserRouter.post("/login",async (req,res) =>{
    try {
    const { email,password} =req.body;
    if(email === process.env.ADMIN_EMAIL & password === process.env.ADMIN_PASSWORD){
        req.session.user={name:"ADM1NC0DR",
                        email:process.env.ADMIN_EMAIL,
                        role:"ADMIN"};
        req.session.admin =true
        let user = req.session.user;
        io.emit("current_user",req.session.user);
        io.emit("log_success")
        res.redirect("/api/products/")
    }else{
        
        let user = await Users.getUser(email);
        if (!user){
        console.log("Usuario o contraseña incorrecta");
        CustomError.createError({
            name:"Error de registro de usuario",
            cause:InfoError.generateUserLogError(),
            message:"Error al iniciar sesión",
            code:EnumError.USER_ERROR
        });
        return res.redirect("/login")
        }
    else if (!isValidPassword(user, password)){
        CustomError.createError({
        name:"Error de registro de usuario",
        cause:InfoError.generateUserLogError(),
        message:"Error al iniciar sesión",
        code:EnumError.USER_ERROR
        });
        return res.redirect("/login")
        }
    else{
        req.logger.info("Identificador de usuario encontrado conectándose")
        user.password=undefined;
        if(user.role==="premium"){
            user.role="premium"
        }else{
        user.role="User"}
        req.session.user=user;
        req.session.admin=false; 
        let new_connect = await Users.last_connect(user.id,new Date())
        io.emit("current_user",req.session.user);
        io.emit("log_success")
        res.redirect("/api/users/current")
    }
    }
    } catch (error) {
    req.logger.error(error)
    return res.redirect("/");
    }
} )

UserRouter.post("/logout", async (req,res) =>{
    try{
        if(req.session.user){
            let last_connect = await Users.last_connect(req.session.user.id,new Date())
            delete req.session.user;
            req.session.destroy((error)=>{
            if (error){
                req.logger.fatal("error al cerrar la sesión actual",error);
                res.status(500).send("Error al cerrar la sesión",error)
            }else{
                req.logger.info("Se ha cerrado la sesión")
                res.redirect("/")
            }
        })}
    
    }catch (error){
        req.logger.fatal("Error al cerrar la sesión",error);
        res.status(500).send("Error al cerrar la sesión")
    }
}
)

UserRouter.post("/restore/:cid",async(req,res)=>{
    let user = await Users.getbyID(req.params.cid);
    let pass =req.body.password_two
    let email=user.email;
    console.log(email)
    if(isValidPassword(user, pass)){
    io.emit("duplexpass")
    req.logger.warn("la contraseña es antigua")
    return res.redirect(`/recovery/${req.params.cid}`)
    }else{
    let result =await Users.resetPass(email,createHash(pass))
    let delete_token =await recovery.deleteToken(req.params.cid)
    req.logger.info("registro de recuperación destruido")
    return res.redirect("/");
    }

})
UserRouter.post("/resetreq",async (req, res) => {
    try {
    const { email } = req.body;
    let user = await Users.getUser(email);
        if (!user){
        CustomError.createError({
            name:"Usererror",
            cause:InfoError.generateUserLogError(),
            message:"Error no se ha encontrado el usuario",
            code:EnumError.USER_ERROR
        });
        return res.redirect("/")
        }
        else{
            return res.redirect(`/api/ticket/pass_token/${user.email}&${user._id}`);
        }
    } catch (error) {
    CustomError.createError({
        name:"Error de registro de usuario",
        cause:InfoError.generateUserLogError(),
        message:"Usuario no encontrado",
        code:EnumError.USER_ERROR
        });
    }
    return res.redirect("/");
    
});

UserRouter.get("/:uid/documents", async (req,res)=>{

    if(req.session.user===undefined){
    CustomError.createError({
        name:"Error de sesión de usuario",
        cause:InfoError.generateUserSesErrorInfo(),
        message:"Sesion cerrada",
        code:EnumError.ROUTING_ERROR
    });        
    res.redirect("/")
    return;
    }
    if(req.session.user.role=="ADMIN"){
        return res.redirect("/api/products/")
    }
    let uid = req.params.uid
    console.log("carga de archivos")
    res.render("index",{layout:"docs_UP", uid});
})

UserRouter.post("/:uid/documents",uploader.any(),async(req,res)=>{
    try{
    if(req.session.user===undefined){
    CustomError.createError({
        name:"Error de sesión de usuario",
        cause:InfoError.generateUserSesErrorInfo(),
        message:"Sesion cerrada",
        code:EnumError.ROUTING_ERROR
    });        
    res.redirect("/")
    return;
}
    if(req.session.user.role=="ADMIN"){
    return res.redirect("/api/products/")
    }
    if(!req.files){
    return res.status(400).send({status:"error",error:"no se ha podido cargar el archivo"})
    }else{
    let documents = await Users.check_files(req.session.user._id)
    let docum=documents
    if(documents.length===0){
    for(let Doc of req.files){
        docum.push({
        doc_name:Doc.fieldname,
        filename:Doc.originalname,
        reference:Doc.destination,
        })
    }
    }
    else{
    for(let oldDocs of documents){
        for(let Doc of req.files){
        if((oldDocs.filename!=Doc.originalname)&&(oldDocs.doc_name===Doc.fieldname)){
            docum[documents.indexOf(oldDocs)]={
            doc_name:Doc.fieldname,
            filename:Doc.originalname,
            reference:Doc.destination,
            }}
    }}
}
    let result = await Users.upload_file(req.params.uid,docum)
    return res.redirect(`/api/users/current`) 
    }
}catch(error){
    CustomError.createError({
    name:"Error de carga",
    cause:InfoError.generateUserSesErrorInfo(),
    message:"Error al cargar el documento",
    code:EnumError.USER_ERROR
    });        
}
})
export default UserRouter;