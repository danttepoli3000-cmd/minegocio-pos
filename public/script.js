const rol = localStorage.getItem("rol");

if (rol !== "admin") {
    window.location = "login.html";
}


const esCajera = window.location.pathname.includes("cajera");

let productoSeleccionado = null;

async function cargarProductos() {

    const respuesta = await fetch("/productos");
    const productos = await respuesta.json();

    const texto = document
        .getElementById("buscar")
        .value
        .toLowerCase();

    let html = "";

    productos
        .filter(p => p.nombre.toLowerCase().includes(texto))
        .forEach(p => {

            html += `
            <div class="producto">

                <h3>${p.nombre}</h3>

                Precio: $${Number(p.precio).toLocaleString("es-CL")}<br>

                Stock: ${p.stock}

                <br><br>

                <button class="vender"
                onclick='venderProducto(${JSON.stringify(p)})'>
                💰 Vender
                </button>

                <button
                onclick='editarProducto(${p.id},${JSON.stringify(p.nombre)},${p.precio},${p.stock})'
                ✏️ Editar
                </button>

                <button
                onclick="agregarStock(${p.id})">
                ➕ Stock
                </button>

                <button class="eliminar"
                onclick="eliminarProducto(${p.id})">
                🗑 Eliminar
                </button>

            </div>
            `;

        });

    document.getElementById("lista").innerHTML = html;

}

async function agregarProducto() {

    const nombre = document.getElementById("nombre").value;

    const precio = Number(document.getElementById("precio").value);

    const stock = Number(document.getElementById("stock").value);

    if (nombre == "" || precio <= 0 || stock <= 0) {

        alert("Completa todos los datos");
        return;

    }

    await fetch("/productos", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nombre,
            precio,
            stock
        })

    });

    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";

    cargarProductos();
    cargarResumen();
    cargarEstadisticas();

}

async function eliminarProducto(id) {

    if (!confirm("¿Eliminar producto?")) {

        return;

    }

    await fetch("/productos/" + id, {

        method: "DELETE"

    });

    cargarProductos();
    cargarHistorial();
    cargarResumen();
    cargarEstadisticas();

}
function venderProducto(producto){

    productoSeleccionado = producto;

    document.getElementById("ventaProducto").innerText =
    producto.nombre;

    document.getElementById("ventaPrecio").innerText =
    "$" + Number(producto.precio).toLocaleString("es-CL");

    document.getElementById("cantidadVenta").value = 1;

    document.getElementById("clientePaga").value = "";

    actualizarTotal();

    calcularVuelto();

}

function actualizarTotal(){

    if(productoSeleccionado == null){

        return;

    }

    const cantidad =
    Number(document.getElementById("cantidadVenta").value);

    const total =
    cantidad * productoSeleccionado.precio;

    document.getElementById("ventaTotal").innerText =
    "$" + Number(total).toLocaleString("es-CL");

}

function calcularVuelto(){

    if(productoSeleccionado == null){

        return;

    }

    const cantidad =
    Number(document.getElementById("cantidadVenta").value);

    const paga =
    Number(document.getElementById("clientePaga").value);

    const total =
    cantidad * productoSeleccionado.precio;

    const vuelto = paga - total;

    document.getElementById("ventaTotal").innerText =
    "$" + Number(total).toLocaleString("es-CL");

    if(paga > 0){

        document.getElementById("vuelto").innerText =
        "$" + Number(vuelto).toLocaleString("es-CL");

    }else{

        document.getElementById("vuelto").innerText = "$0";

    }

}

document.getElementById("cantidadVenta")
.addEventListener("input",()=>{

    actualizarTotal();
    calcularVuelto();

});

document.getElementById("clientePaga")
.addEventListener("input",calcularVuelto);


async function confirmarVenta(){

    if(!productoSeleccionado){
        alert("Selecciona un producto");
        return;
    }
const cantidad = Number(document.getElementById("cantidadVenta").value);
const paga = Number(document.getElementById("clientePaga").value);
const total = cantidad * productoSeleccionado.precio;

   if (cantidad <= 0) return alert("Cantidad inválida");
if (paga < total) return alert("El dinero no alcanza");

   imprimirTicket(
    productoSeleccionado,
    cantidad,
    total,
    paga,
    paga - total
);

    const respuesta = await fetch("/ventas",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            id:productoSeleccionado.id,
            cantidad,
            total
        })
    });

    const datos = await respuesta.json();

    if(datos.ok){

        alert("✅ Venta registrada correctamente");

        cargarProductos();
        cargarHistorial();
        cargarResumen();
        cargarEstadisticas();

        productoSeleccionado = null;

        document.getElementById("ventaProducto").innerText = "Ninguno";
        document.getElementById("ventaPrecio").innerText = "$0";
        document.getElementById("ventaTotal").innerText = "$0";
        document.getElementById("vuelto").innerText = "$0";
        document.getElementById("clientePaga").value = "";
        document.getElementById("cantidadVenta").value = 1;

    }else{

        alert(datos.mensaje || "Error al vender");

    }

}
async function cargarHistorial(){

    let url = "/ventas";

    // si es cajera, solo hoy
    if(esCajera){
        url = "/ventas?filtro=hoy";
    }

    const respuesta = await fetch(url);
    const ventas = await respuesta.json();

    let html = "";

    ventas.forEach(v=>{

        html += `
        <div class="producto">

            <b>${v.producto}</b><br>

            Cantidad: ${v.cantidad}<br>

            Total: $${Number(v.total).toLocaleString("es-CL")}<br>

            Fecha: ${v.fecha}

        </div>
        <br>
        `;

    });

    document.getElementById("historial").innerHTML = html;
}

async function cargarResumen(){

    const respuesta = await fetch("/resumen");

    const datos = await respuesta.json();

    document.getElementById("totalVentas").innerText =
    datos.ventas;

    document.getElementById("dineroTotal").innerText =
    "$" + Number(datos.dinero).toLocaleString("es-CL");

}

async function editarProducto(id,nombre,precio,stock){

    const nuevoNombre = prompt("Nombre",nombre);

    if(nuevoNombre == null){

        return;

    }

    const nuevoPrecio = Number(prompt("Precio",precio));

    if(nuevoPrecio <= 0){

        return;

    }

    const nuevoStock = Number(prompt("Stock",stock));

    if(nuevoStock < 0){

        return;

    }

    await fetch("/productos/" + id,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            nombre:nuevoNombre,
            precio:nuevoPrecio,
            stock:nuevoStock

        })

    });

    cargarProductos();
    cargarResumen();
    cargarEstadisticas();

}

async function agregarStock(id){

    const cantidad =
    Number(prompt("¿Cuánto stock deseas agregar?"));

    if(cantidad <= 0){

        return;

    }

    await fetch("/stock/" + id,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            cantidad

        })

    });

    cargarProductos();
    cargarResumen();
    cargarEstadisticas();

}

async function cargarEstadisticas(){

    const respuesta =
    await fetch("/estadisticas");

    const datos =
    await respuesta.json();

    document.getElementById("ventasHoy").innerText =
    "$" + Number(datos.hoy).toLocaleString("es-CL");

    document.getElementById("ventasMes").innerText =
    "$" + Number(datos.mes).toLocaleString("es-CL");

}

/* Carga inicial */

cargarProductos();
cargarHistorial();
cargarResumen();
cargarEstadisticas();

function imprimirTicket(producto, cantidad, total, paga, vuelto){

    const fecha = new Date().toLocaleString("es-CL");

    const ventana = window.open("", "_blank");

    ventana.document.write(`
        <html>
        <head>
        <title>Ticket</title>

        <style>
            body{
                font-family: monospace;
                width: 300px;
                margin: auto;
                padding: 10px;
            }

            .ticket{
                border: 1px dashed #000;
                padding: 10px;
            }

            h2{
                text-align:center;
                font-size:16px;
            }

            .linea{
                display:flex;
                justify-content:space-between;
            }

            .total{
                font-weight:bold;
                font-size:18px;
                margin-top:10px;
            }

            .center{
                text-align:center;
            }
        </style>

        </head>

        <body onload="window.print()">

        <div class="ticket">

            <h2>🛒 MI NEGOCIO POS</h2>

            <p class="center">${fecha}</p>

            <hr>

            <div class="linea">
                <span>Producto</span>
                <span>${producto.nombre}</span>
            </div>

            <div class="linea">
                <span>Cantidad</span>
                <span>${cantidad}</span>
            </div>

            <div class="linea">
                <span>Precio</span>
                <span>$${Number(producto.precio).toLocaleString("es-CL")}</span>
            </div>

            <hr>

            <div class="linea total">
                <span>TOTAL</span>
                <span>$${total.toLocaleString("es-CL")}</span>
            </div>

            <div class="linea">
                <span>Paga</span>
                <span>$${paga.toLocaleString("es-CL")}</span>
            </div>

            <div class="linea">
                <span>Vuelto</span>
                <span>$${vuelto.toLocaleString("es-CL")}</span>
            </div>

            <br>

            <p class="center">Gracias por su compra</p>

        </div>

        </body>
        </html>
    `);

    ventana.document.close();
}

async function cargarHistorialAgrupado() {

    const res = await fetch("/ventas-agrupadas");
    const data = await res.json();

    let html = "";

    data.forEach(dia => {

        html += `
        <div class="card">
            <h2>📅 ${dia.dia}</h2>
            <h3>Total del día: $${dia.totalDia.toLocaleString("es-CL")}</h3>
            <hr>
        `;

        dia.ventas.forEach(v => {

            html += `
                <div>
                    🧾 ${v.producto} - x${v.cantidad} - $${Number(v.total).toLocaleString("es-CL")}
                </div>
            `;

        });

        html += `</div><br>`;

    });

    document.getElementById("historial").innerHTML = html;
}
function cerrarSesion(){
    localStorage.removeItem("rol");
    window.location = "login.html";
}