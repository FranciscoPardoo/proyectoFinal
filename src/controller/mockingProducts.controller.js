import {Router} from "express";
import * as product from "../services/prodMock.services.js";
import io from "../app.js";

import  {generateProduct}  from "../utils/mock.utils.js";

const MockedProuductRouter = Router();

MockedProuductRouter.post("/edit_items",async(req,res)=>{
    try{
    const{showName,_id,title,description,code,price,stock,category}=req.body;
    console.log(showName)
    if(showName === "delete"){
        const ID_delete= await product.removeProduct(_id);
        console.log("Item by ID:",_id," ha sido eliminado")
        res.redirect("/api/products/edit_items")
    }
    else if(showName === true){
        const old_info=await product.getByID(_id)
        const new_info={
            title:title||old_info.title,
            description:description||old_info.description,
            code:code||old_info.code,
            price:price||old_info.price,
            stock:stock||old_info.stock,
            category:category||old_info.category,
            thumbnail:old_info.thumbnail||"https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png"
        }
        console.log("New Info",new_info)
        const update = await product.updateProduct(_id,new_info)
        res.redirect("/api/products/edit_items")
    }
    else{
        const new_info={
            title:title||"DummyItem",
            description:description||"Hey es un elemento ficticio",
            code:code||"DUMMY_ITEM",
            price:price||"69",
            stock:stock||"69",
            category:category||"655b92be363b19dfbd005b5b",
            thumbnail:'https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png'
        }
        const new_item= await product.addProduct(new_info)
        res.redirect("/api/products/edit_items")
    }}
    catch(error){
        console.log("Se ha producido un error",error)
        res.redirect("/api/products/edit_items")
    }
})
MockedProuductRouter.get("/edit_items",async (req,res)=>{
    if(req.session.user === undefined){
        console.log("oh no, la sesión ha expirado")
        res.redirect("/")
        return;
    }
    let page = parseInt(req.query.page);
    if(!page) page=1;
    const products = await product.paginate([{},{page,limit:10,lean:true}])
    products.prevLink = products.hasPrevPage?`https://proyectofinal-hw87.onrender.com/${products.prevPage}`:'';
    products.nextLink = products.hasNextPage?`https://proyectofinal-hw87.onrender.com/${products.nextPage}`:'';
    products.isValid= !(page<=0||page>products.totalPages)
    const current_user=req.session.user
    res.render('index',{
        layout:'edit_item',products,current_user})
})
MockedProuductRouter.get("/:id",async (req,res)=>{
    const {id} =req.params;
    const Product = await product.getByID(id)
    res.status(200).json({status:"Sucess",message:product})
})
MockedProuductRouter.post("/",async (req,res)=>{
    try{
        
        const productinfo={
            title:req.body.title,
            description:req.body.description,
            price:req.body.price,
            category:req.body.price,
            thumbnail:req.body.thumbnail||"https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png",
            visible:req.body.visible||true
        }
        const newProduct = await product.addProduct(productinfo)
        res.status(200).json({status:"Sucess",message:newProduct})
    }catch(error){
        res.status(501).json({status:"Error",message:error})
        throw error;
    }
})

MockedProuductRouter.get('/', async (req,res)=>{
    try{
        let current_user="Placeholderplaceholder";
        let isAdmin =false;
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
            products =await product.paginate([{},{page,limit:value_query,lean:true}]) //limit de resultados en pantalla
        }
        else if (name_query ==="sort"){
            has_query=true
            if(value_query ==="asc"){
                products =await product.paginate([{},{page,limit:10,lean:true,sort:{price:1}}])
            }else{products =await product.paginate([{},{page,limit:10,lean:true,sort:{price:-1}}])
            }
        }
        else if (Object.values(query).length>=2){
            has_query=true
            products = await product.paginate([query,{page,limit:10,lean:true}])
        }
        else if (name_query === "category"){
            products = await product.paginate([query,{page,limit:10,lean:true}])
        }
        else{
            has_query=false
            products = await product.paginate([{},{page,limit:10,lean:true}])
        }
        if (has_query){
            products.prevLink = products.hasPrevPage?`http://localhost:3000/mockingproducts/?${name_query}=${value_query}&page=${products.prevPage}`:'';
            products.nextLink = products.hasNextPage?`http://localhost:3000/mockingproducts/?${name_query}=${value_query}&page=${products.nextPage}`:'';
        }else{
        products.prevLink = products.hasPrevPage?`http://localhost:3000/mockingproducts/?page=${products.prevPage}`:'';
        products.nextLink = products.hasNextPage?`http://localhost:3000/mockingproducts/?page=${products.nextPage}`:'';}
        products.isValid= !(page<=0||page>products.totalPages)
        res.render('index',{
                layout:'mockingproducts'
                ,products,current_user,isAdmin})
    }catch(error){res.status(500).json({message:error.message})}
})

export default MockedProuductRouter;