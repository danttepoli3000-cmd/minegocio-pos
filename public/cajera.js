const rol = localStorage.getItem("rol");
const token = localStorage.getItem("token");

if (rol !== "cajera" || !token) {
    window.location = "login.html";
}

let productoSeleccionado = null;

/* =========================
   PRODUCTOS
========================= */

async function cargarProductos() {

    const res = await fetch("/productos", {
        headers: {
            "Authorization": "Bearer " + token
        }
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

            </div><br>
            `;
        });

    document.getElementById("lista").innerHTML = html;
}

/* =========================
   VENTA
========================= */

function venderProducto(producto) {

    productoSeleccionado = producto;

    document.getElementById("ventaProducto").innerText = producto.nombre;

    document.getElementById("ventaPrecio").innerText =
        "$" + Number(producto.precio).toLocaleString("es-CL");

    document.getElementById("cantidadVenta").value = 1;
    document.getElementById("clientePaga").value = "";

    actualizarTotal();
}

function actualizarTotal() {

    if (!productoSeleccionado) return;

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const total = cantidad * productoSeleccionado.precio;

    document.getElementById("ventaTotal").innerText =
        "$" + Number(total).toLocaleString("es-CL");

    calcularVuelto();
}

function calcularVuelto() {

    if (!productoSeleccionado) return;

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const paga = Number(document.getElementById("clientePaga").value);

    const total = cantidad * productoSeleccionado.precio;
    const vuelto = paga - total;

    document.getElementById("vuelto").innerText =
        "$" + Number(vuelto || 0).toLocaleString("es-CL");
}

/* =========================
   EVENTOS
========================= */

document.getElementById("cantidadVenta")
.addEventListener("input", actualizarTotal);

document.getElementById("clientePaga")
.addEventListener("input", calcularVuelto);

/* =========================
   CONFIRMAR VENTA
========================= */

async function confirmarVenta() {

    if (!productoSeleccionado) {
        alert("Selecciona un producto");
        return;
    }

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const paga = Number(document.getElementById("clientePaga").value);

    const total = cantidad * productoSeleccionado.precio;

    if (cantidad <= 0) return alert("Cantidad inválida");
    if (paga < total) return alert("El dinero no alcanza");

    imprimirTicket(productoSeleccionado, cantidad, total, paga, paga - total);

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

        alert("✅ Venta registrada");

        cargarProductos();

        productoSeleccionado = null;

        document.getElementById("ventaProducto").innerText = "Ninguno";
        document.getElementById("ventaPrecio").innerText = "$0";
        document.getElementById("ventaTotal").innerText = "$0";
        document.getElementById("vuelto").innerText = "$0";
        document.getElementById("clientePaga").value = "";
        document.getElementById("cantidadVenta").value = 1;

    } else {
        alert(data.mensaje || "Error al vender");
    }
}

/* =========================
   TICKET
========================= */

function imprimirTicket(producto, cantidad, total, paga, vuelto) {

    const fecha = new Date().toLocaleString("es-CL");

    const ventana = window.open("", "_blank");

    ventana.document.write(`
    <html>
    <head>
    <title>Ticket</title>
    <style>
        body{font-family: monospace; width:300px; margin:auto; padding:10px;}
        .linea{display:flex; justify-content:space-between;}
        .ticket{border:1px dashed #000; padding:10px;}
        h2{text-align:center;}
    </style>
    </head>

    <body onload="window.print()">
    <div class="ticket">

        <h2>🛒 MI NEGOCIO POS</h2>
        <p>${fecha}</p>

        <hr>

        <div class="linea"><span>Producto</span><span>${producto.nombre}</span></div>
        <div class="linea"><span>Cantidad</span><span>${cantidad}</span></div>
        <div class="linea"><span>Total</span><span>$${total}</span></div>

        <hr>

        <div class="linea"><span>Paga</span><span>$${paga}</span></div>
        <div class="linea"><span>Vuelto</span><span>$${vuelto}</span></div>

    </div>
    </body>
    </html>
    `);

    ventana.document.close();
}

/* =========================
   INICIO
========================= */

cargarProductos();

/* =========================
   LOGOUT
========================= */

function cerrarSesion() {
    localStorage.removeItem("rol");
    localStorage.removeItem("token");
    window.location = "login.html";
}