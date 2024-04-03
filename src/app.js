import express from "express";
import compression from"express-compression";
import  {Server}  from "socket.io";
import handlebars from 'express-handlebars';
import path from 'path';
import session from 'express-session';
import cors from "cors";
import mongoConnect from "./db/db.mongo.js";
import MongoStore from 'connect-mongo';
import "dotenv/config.js";
import cookieParser from 'cookie-parser';
import __dirname from './utils.js';
import socketserv from "./socketInteract.js";
import router from "./routes/router.js";
import errorHandler from "./middlewares/errors/handle.errors.js";
import {addLogger} from "./middlewares/logger/logger.middleware.js";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';


const app = express();
const port =3000;

app.use(compression({
    broli:{enable:true,zlib:{}}
}))
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

mongoConnect();

const swaggerOptions ={
    definition:{
        openapi:"3.0.1",
        info:{
            title:"Documentación de la API Animal Crossing Ecomerce",
            description:"Esta es la documentación para la API de Animal Crossing Ecomerece, aquí estará la documentación para los endpoints de Carritos y productos"
        }, },
        apis:[`${__dirname}/docs/**/*.yaml`]
}

const specs=swaggerJsdoc(swaggerOptions)

app.use('/apidocs',swaggerUiExpress.serve,swaggerUiExpress.setup(specs))
app.engine('handlebars', handlebars.engine());
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'handlebars');
app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/private_docs'))
app.use(cookieParser());

app.use(session({
    secret:process.env.KEYSECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl:process.env.MONGODB_URL,
        ttl: 4*120,
        autoRemove:"native"    
    }),
}));

app.use(addLogger);
router(app);

const httpServer =app.listen(port,()=>{
    console.log(`Servidor escuchando en el puerto: ${port}`)
})
const io = new Server(httpServer);
socketserv(io);
app.use(errorHandler)


export default io;