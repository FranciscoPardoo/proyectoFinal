const socket = io();

socket.on("uploading",()=>{
  let flag =true
  while(flag){
  socket.on("finished",()=>{
    flag=false
  })
  window.onbeforeunload = function (event) {
    event.returnValue = Swal.fire({
      title: '¿Seguro que quieres irte?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si'
    }).then((result) => {
      if (result.isConfirmed) {
        return undefined;
      } else {
        event.preventDefault();
        return;
      }
    });
  };

}
})


console.log("cart connected")
socket.on("current_user", (data)=>{
  console.log("sending",data)
  socket.emit("update_user",data)
})
socket.on("log_success",()=>{
  socket.emit("gater_cart")
})

socket.on("list_user",(data)=>{
    const usercartDiv = document.getElementById('usercart');
    usercartDiv.innerHTML = `<h2>Artículos de su carrito</h2>`;
})
let item_button = document.getElementsByClassName('add_to_cart')
console.log(item_button)
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
  let inner_text = `<h2>Su carrito</h2>
    <p>Estos son algunos artículos de su carrito</p>`;
  inner_text += `<h1>Total: ${data[1].total}</h1>`;

  for (let product in data[1].products) {
    let pointer = data[1].products[product];
    inner_text += `
      <ul id=${pointer.product}>
        <h3>>ID: ${pointer.product}</h3>
        <img src="${pointer.thumbnail}" style="width:150px; border:1px solid black; "alt="https://dodo.ac/np/images/a/af/Leaf_NH_Icon.png">
        <h2>Nombre: ${pointer.name}</h2>
        <li>Precio: ${pointer.price}</li>
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
const sortBySelect = document.getElementById('SortBy');
const categorySelect = document.getElementById('Category');
const priceSelect = document.getElementById('Price_sort');
const submit_button = document.getElementById('sort_button')
priceSelect.style.display = 'none';
let type_sort ="";
sortBySelect.addEventListener('change', () => {
    if (sortBySelect.value === 'Category') {
      categorySelect.style.display = 'inline';
      priceSelect.style.display = 'none';
    } else {
      categorySelect.style.display = 'none';
      priceSelect.style.display = 'inline';
    }
  });
  
submit_button.addEventListener('click',()=>{
    if (sortBySelect.value === 'Category') {
        submit_button.value=categorySelect.value
        type_sort="category"
      }
      else{
        submit_button.value=priceSelect.value
        type_sort="sort"
      }

    socket.emit("sort_now",[type_sort,submit_button.value])
})  

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
socket.on("ADMIN",()=>{
  const errorMessage = {
    title: "Espere un momento",
    text: "Lo siento, parece que este perfil no tiene un carro, por favor inicie sesión como USUARIO",
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
socket.on("Youownthis",()=>{
  console.log("wrong")
  Swal.fire({
    position: "top-end",
    icon: "Error",
    title: "El artículo seleccionado es uno de los que está vendiendo",
    showConfirmButton: false,
    timer: 3000
  });
})
socket.on("NotOwned",()=>{
  console.log("wrong")
  Swal.fire({
    position: "top-end",
    icon: "Error",
    title: "No puede eliminar un artículo que no vende",
    showConfirmButton: false,
    timer: 3000
  });
})