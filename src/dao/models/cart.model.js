import mongoose from 'mongoose';

const {Schema,model}=mongoose;

const cartsSchema =new Schema({
    username: {type:String,ref:"user" ,required:true,ref:"users"},
    products:[{
        product: {type:Schema.Types.ObjectId,ref:"Products"},
        name:{type:String,ref:"Products"},
        thumbnail:{type:String},
        price:{type:Number,ref:"Products"},
        quantity:{type:Number, default: 0},
        _id:{type:Schema.Types.ObjectId,ref:"Products"}
    }],
    total: {type:Number, default: 0}
});

const CartModel= model ("Cart",cartsSchema);


export default CartModel;