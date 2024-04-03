import dotenv from "dotenv"

dotenv.config();
export default {
    db: process.env.MONGODB_URL
}