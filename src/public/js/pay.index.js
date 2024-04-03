const socket = io();
console.log("cart access connected")
socket.on("current_user", (data)=>{
  console.log("sending",data)
  socket.emit("update_user",data)
})


let add = document.getElementsByClassName("add_cart")
let remove = document.getElementsByClassName("remove_cart")
socket.on("cart_updated", (data,why) => {
  const usercartDiv = document.getElementById("usercart");
  let inner_text = ``;
  inner_text += `<h1>Total: ${data[1].total}</h1>
  <form  action="/api/ticket/${data[1]._id}/" method ="get">
  <button type="submit">Pagar ahora</button>
  </form>
  <form  action="/api/cart/${data[1]._id}/" method ="get">
  <button type="submit">Cancelar!</button>
  </form>`;
  for (let product in data[1].products) {
    let pointer = data[1].products[product];
    inner_text += `
      <ul id=${pointer.product}>
        <img src="${pointer.thumbnail}" style="width:150px; border:1px solid black; "alt="https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png">
        <h1>Nombre: ${pointer.name}</h2>
        <h3>Precio: ${pointer.price}</h3>
        <h3>Cantidad: ${pointer.quantity}</h3>
      </ul>`;
  }
  usercartDiv.innerHTML=(inner_text);
});




socket.on('redirect',function(destination){
    window.location.href=destination;
})

socket.on("not_enough",()=>{
    const errorMessage = {
        title: "Oh no :(",
        text: "Parece que no tenemos stock suficiente del artículo seleccionado.",
        icon: "error"
      };
    
      Swal.fire(errorMessage);
})

socket.on("somethig_wrong",()=>{
  console.log("wrong")
  Swal.fire({
    position: "top-end",
    icon: "Error",
    title: "Algo ha ido mal, por favor, compruebe la información enviada y vuelva a intentarlo.",
    showConfirmButton: false,
    timer: 1500
  });
})