const socket = io();
socket.on("current_user", (data)=>{
  console.log("sending",data)
  socket.emit("update_user",data)
})
let item_button = document.getElementsByClassName('add_to_cart')
for (const button of item_button) {
    button.addEventListener('click',() =>{
        console.log("calling",button.value)
        socket.emit('add_to_cart',button.value)
    })
}

let add = document.getElementsByClassName("add_cart")
let remove = document.getElementsByClassName("remove_cart")
socket.on("cart_updated", (data,why) => {
  const usercartDiv = document.getElementById("usercart");
  let inner_text = `<h2>${data[1].username}: Estos artículos están en su carrito</h2>`;
  inner_text += `<h1>Total: ${data[1].total} </h1>
  <form  action="/api/cart/${data[2]}/payment/" method ="get">
  <button type="submit">Proceder al pago</button>
  </form>`;
  for (let product in data[1].products) {
    let pointer = data[1].products[product];
    inner_text += `
      <ul id=${pointer.product}>
        <h3>>ID: ${pointer.product}</h3>
        <img src="${pointer.thumbnail}" style="width:150px; border:1px solid black; "alt="https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png">
        <h2>Nombre: ${pointer.name}</h2>
        <li>Precio: ${pointer.price} </li>
        <li>Cantidad: ${pointer.quantity}</li>
      </ul>
      <button   type="button" id="" class="add_cart" value= ${pointer.product}>Añadir</button>
      <button   type="button" id="" class="remove_cart" value=${pointer.product}>Quitar</button>
      </br>`;
  }

  usercartDiv.innerHTML=(inner_text);
  updatebuttons()
});
function updatebuttons(){
  add = document.getElementsByClassName("add_cart")
  remove = document.getElementsByClassName("remove_cart")
for (const button of add) {
  button.addEventListener('click',() =>{
      console.log("add",button.value)
      socket.emit('add_to_cart',button.value)
  })
}
for (const button of remove) {
  button.addEventListener('click',() =>{
      console.log("remove",button.value)
      socket.emit('remove_from_cart',button.value)
  })
}
}

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