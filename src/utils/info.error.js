
export const generateUserRegErrorInfo=(data)=>{
    return`
    Uno o más campos del proceso de registro están vacíos o no son válidos.
    Campos obligatorios:
    Nombre: String value, recived : ${data.name}.
    Apellido: Valor de cadena, recibido: ${data.last_name}.
    Email: Valor de cadena, obtenido: ${data.email}.
    Fecha Nacimiento : Valor de fecha, recibido:${data.age}.
    Contraseña: Valor de cadena, debe proporcionarse oculta por razones de seguridad.`
}
export const generateUserAgeErrorInfo=()=>{
    return `
    Lamentamos que tenga que ser mayor de 18 años para utilizar esta aplicación.`
}
export const generateUserSesErrorInfo=()=>{
    return`
    La sesión ha expirado por inactividad. Por favor, conéctese de nuevo.`
}
export const generateCartErrorInfo=()=>{
    return `
    Algo salió mal al obtener la información del carrito:
    -El carrito puede estar vacío 
    -El usuario podría no tener un carrito asociado `
}
export const generateProductUpdateErrorInfo=(prod_info)=>{
    return `
    Se ha producido un error en la solicitud.
    Por favor, compruebe que el ID proporcionado es el correcto y no tiene ningún lugar al final.
    ID proporcionado: ${prod_info}`
}
export const generateRoutingErrorInfo=()=>{
    return `
    Acceso denegado, esta ruta no es accesible con los privilegios de usuario actuales`
}
export const generateUserLogError=()=>{
    return `Correo electrónico o contraseña incorrectos, inténtelo de nuevo`
}

export const generateDatabaseErrorInfo=()=>{
    return `Se ha producido un error al acceder a la base de datos.
    Por favor, inténtelo de nuevo o compruebe la conexión a Internet`
}