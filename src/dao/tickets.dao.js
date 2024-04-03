import ticketModel from "../dao/models/ticket.model.js";

class ticketDAO{
    constructor(){}

    async createTicket(ticket_info){
        try{
            return await ticketModel.create(ticket_info);
        }catch(error){
            console.log("error")
            throw error;
        }

    }
}
export default ticketDAO;