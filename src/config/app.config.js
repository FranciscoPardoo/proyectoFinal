import "dotenv/config.js";

export const appConfig ={
    environment: process.env.FACTORY || "production"
}