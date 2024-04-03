import moongoose from "mongoose";
import  config  from "../config/env.config.js";

const mongoConnect = async() =>{
    try{
        await moongoose.connect(config.db);
        console.log("Base de datos levantada");
    }catch(error){
        console.log("Ha ocurrido un error al levantar la base de datos",error);
    }
}

export default mongoConnect;