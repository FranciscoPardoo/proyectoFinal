import UserRouter  from "../controller/user.controller.js";
import {ProuductRouter}  from "../controller/products.controller.js";
import indexRouter from './views/index.js';
import loginRouter from './views/logging.js'
import registerRouter from './views/register.js'
import profileRouter from "./views/profile.js";
import recoveryPassword from "./views/recoveryPassword.js";
import cartRouter from "../controller/cart.controller.js";
import mailRouter from "../controller/mail.controller.js";
import MockedProuductRouter  from "../controller/mockingProducts.controller.js";
import loggerTest from "../controller/loggerTest.controller.js";

const router =(app)=>{
    app.use('/',indexRouter);
    app.use('/profile',profileRouter)
    app.use('/login',loginRouter);
    app.use('/register',registerRouter);
    app.use("/recovery", recoveryPassword);
    app.use("/api/users",UserRouter)
    app.use("/api/sessions",UserRouter);
    app.use("/api/products",ProuductRouter);
    app.use("/api/cart",cartRouter);
    app.use("/api/ticket",mailRouter);
    app.use("/mockingproducts",MockedProuductRouter);
    app.use("/loggerTest",loggerTest);
}

export default router;