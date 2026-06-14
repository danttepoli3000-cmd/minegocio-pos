const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");
let productoSeleccionado = null;

function venderProducto(producto) {

    productoSeleccionado = producto;

    document.getElementById("ventaProducto").innerText = producto.nombre;

    document.getElementById("ventaPrecio").innerText =
        "$" + Number(producto.precio).toLocaleString("es-CL");

    document.getElementById("cantidadVenta").value = 1;
    document.getElementById("clientePaga").value = "";
    document.getElementById("ventaTotal").innerText =
        "$" + Number(producto.precio).toLocaleString("es-CL");
    document.getElementById("vuelto").innerText = "$0";

    actualizarTotal();
}

function actualizarTotal() {

    if (!productoSeleccionado) return;

    const cantidad =
        Number(document.getElementById("cantidadVenta").value) || 1;

    const total =
        cantidad * Number(productoSeleccionado.precio);

    document.getElementById("ventaTotal").innerText =
        "$" + total.toLocaleString("es-CL");

    calcularVuelto();
}

function calcularVuelto() {

    if (!productoSeleccionado) return;

    const cantidad =
        Number(document.getElementById("cantidadVenta").value) || 0;

    const texto =
        document.getElementById("clientePaga").value;

    if (texto === "") {
        document.getElementById("vuelto").innerText = "$0";
        return;
    }

    const paga = Number(texto);
    const total = cantidad * Number(productoSeleccionado.precio);
    const vuelto = paga - total;

    document.getElementById("vuelto").innerText =
        "$" + vuelto.toLocaleString("es-CL");
}

function authHeaders(extra = {}) {
    return {
        "Authorization": "Bearer " + token,
        ...extra
    };
}

/* =======================
   PRODUCTOS
======================= */
async function cargarProductos() {

    const res = await fetch("/productos", {
        headers: authHeaders()
    });

    const productos = await res.json();

    const texto = document.getElementById("buscar")?.value.toLowerCase() || "";

    let html = "";

    productos
        .filter(p => p.nombre.toLowerCase().includes(texto))
        .forEach(p => {

           html += `
<div class="producto">

    <h3>${p.nombre}</h3>

    Precio: $${Number(p.precio).toLocaleString("es-CL")}<br>

   
    ${
    p.stock == 0
        ? "<span style='color:red;font-weight:bold;'>🔴 SIN STOCK</span><br><br>"
        : p.stock <= 2
        ? "<span style='color:orange;font-weight:bold;'>⚠️ Stock bajo: " + p.stock + "</span><br><br>"
        : "Stock: " + p.stock + "<br><br>"
}

    <button onclick='venderProducto(${JSON.stringify(p)})'>
        💰 Vender
    </button>

    <button onclick='editarProducto(${p.id}, "${p.nombre}", ${p.precio}, ${p.stock})'>
        ✏️
    </button>

    <button onclick='agregarStock(${p.id})'>
        ➕
    </button>

    <button onclick='eliminarProducto(${p.id})'>
        🗑
    </button>

</div><br>
`;
        });

    document.getElementById("lista").innerHTML = html;
}

/* AGREGAR */
async function agregarProducto() {

    await fetch("/productos", {
        method: "POST",
        headers: authHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({
            nombre: nombre.value,
            precio: Number(precio.value),
            stock: Number(stock.value)
        })
    });

    cargarProductos();
}

/* ELIMINAR */
async function eliminarProducto(id) {

    await fetch("/productos/" + id, {
        method: "DELETE",
        headers: authHeaders()
    });

    cargarProductos();
}

/* STOCK */
async function agregarStock(id) {

    const cantidad = Number(prompt("Cantidad"));

    await fetch("/stock/" + id, {
        method: "PUT",
        headers: authHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({ cantidad })
    });

    cargarProductos();
}

/* HISTORIAL */
async function cargarHistorial() {

    const res = await fetch("/ventas", {
        headers: authHeaders()
    });

    const data = await res.json();

    let html = "";

    data.forEach(d => {

        const fecha = new Date(d.dia);

        const dia =
            fecha.getDate().toString().padStart(2, "0") + "/" +
            (fecha.getMonth() + 1).toString().padStart(2, "0") + "/" +
            fecha.getFullYear();

        html += `
        <div class="producto">

        <h3>📅 ${dia}</h3>
        `;

        let totalDia = 0;

        d.ventas.forEach(v => {

            totalDia += Number(v.total);

            html += `
            ${v.producto}
            x${v.cantidad}
            =
            $${Number(v.total).toLocaleString("es-CL")}
            <br>
            `;

        });

        html += `
        <hr>
        <b>Total del día:
        $${totalDia.toLocaleString("es-CL")}</b>

        </div><br>
        `;
    });

    document.getElementById("historial").innerHTML = html;
}

/* RESUMEN + ESTADISTICAS */
async function cargarResumen() {

    const res = await fetch("/resumen", { headers: authHeaders() });
    const data = await res.json();

    totalVentas.innerText = data.ventas;
    dineroTotal.innerText = "$" + data.dinero.toLocaleString("es-CL");
}

async function cargarEstadisticas() {

    const res = await fetch("/estadisticas", { headers: authHeaders() });
    const data = await res.json();

    ventasHoy.innerText = "$" + data.hoy.toLocaleString("es-CL");
    ventasMes.innerText = "$" + data.mes.toLocaleString("es-CL");
}
document.getElementById("cantidadVenta")
.addEventListener("input", actualizarTotal);

document.getElementById("clientePaga")
.addEventListener("input", calcularVuelto);
/* INIT */
cargarProductos();
cargarHistorial();
cargarResumen();
cargarEstadisticas();

async function confirmarVenta() {

   if (productoSeleccionado.stock <= 0) {
    alert("❌ Este producto no tiene stock.");
    return;
}

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const paga = Number(document.getElementById("clientePaga").value);

    const total = cantidad * productoSeleccionado.precio;

    if (cantidad <= 0) {
        alert("Cantidad inválida");
        return;
    }

    if (paga < total) {
        alert("El cliente no paga suficiente");
        return;
    }

    const res = await fetch("/ventas", {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },

        body: JSON.stringify({
            id: productoSeleccionado.id,
            cantidad,
            total
        })

    });

    const data = await res.json();

    if (data.ok) {

        alert("✅ Venta realizada");

        productoSeleccionado = null;

        document.getElementById("ventaProducto").innerText = "Ninguno";
        document.getElementById("ventaPrecio").innerText = "$0";
        document.getElementById("ventaTotal").innerText = "$0";
        document.getElementById("clientePaga").value = "";
        document.getElementById("cantidadVenta").value = 1;
        document.getElementById("vuelto").innerText = "$0";

        cargarProductos();
        cargarHistorial();
        cargarResumen();
        cargarEstadisticas();

    } else {

        alert(data.mensaje || "Error al vender");

    }
}
async function editarProducto(id, nombreActual, precioActual, stockActual) {

    const nombre = prompt("Nombre del producto:", nombreActual);
    if (nombre === null) return;

    const precio = Number(prompt("Precio:", precioActual));
    if (isNaN(precio)) return;

    const stock = Number(prompt("Stock:", stockActual));
    if (isNaN(stock)) return;

    const res = await fetch("/productos/" + id, {
        method: "PUT",
        headers: authHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({
            nombre,
            precio,
            stock
        })
    });

    const data = await res.json();

    if (data.ok) {
        alert("✅ Producto actualizado");
        cargarProductos();
    } else {
        alert("Error al actualizar");
    }
}

function imprimirHistorial() {

    const contenido =
        document.getElementById("historial").innerHTML;

    const ventana = window.open("", "_blank");

    ventana.document.write(`
        <html>

        <head>

        <title>Historial de Ventas</title>

        <style>

        body{
            font-family:Arial;
            padding:20px;
        }

        h1{
            text-align:center;
        }

        </style>

        </head>

        <body>

        <h1>📋 Historial de Ventas</h1>

        ${contenido}

        </body>

        </html>
    `);

    ventana.document.close();

    ventana.print();
}







function cerrarSesion() {
    localStorage.clear();
    window.location = "login.html";
}