const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

let productoSeleccionado = null;

/* =========================
   AUTH
========================= */
function authHeaders(extra = {}) {
    return {
        "Authorization": "Bearer " + token,
        ...extra
    };
}

/* =========================
   PROTEGER
========================= */
if (!token || rol !== "admin") {
    window.location.href = "login.html";
}

/* =========================
   PRODUCTOS
========================= */
async function cargarProductos() {

    const res = await fetch("/productos", {
        headers: authHeaders()
    });

    if (!res.ok) return;

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
                Stock: ${p.stock}<br><br>

                <button onclick='venderProducto(${JSON.stringify(p)})'>💰</button>
                <button onclick='editarProducto(${p.id}, "${p.nombre}", ${p.precio}, ${p.stock})'>✏️</button>
                <button onclick='agregarStock(${p.id})'>➕</button>
                <button onclick='eliminarProducto(${p.id})'>🗑</button>
            </div><br>
            `;
        });

    document.getElementById("lista").innerHTML = html;
}

/* =========================
   VENTA
========================= */
function venderProducto(p) {

    productoSeleccionado = p;

    document.getElementById("ventaProducto").innerText = p.nombre;
    document.getElementById("ventaPrecio").innerText = "$" + p.precio;

    document.getElementById("cantidadVenta").value = 1;
    document.getElementById("clientePaga").value = "";

    actualizarTotal();
}

function actualizarTotal() {

    if (!productoSeleccionado) return;

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const total = cantidad * productoSeleccionado.precio;

    document.getElementById("ventaTotal").innerText = "$" + total;

    calcularVuelto();
}

function calcularVuelto() {

    if (!productoSeleccionado) return;

    const cantidad = Number(document.getElementById("cantidadVenta").value) || 0;
    const paga = Number(document.getElementById("clientePaga").value) || 0;

    const total = cantidad * productoSeleccionado.precio;
    const vuelto = paga - total;

    document.getElementById("vuelto").innerText = "$" + vuelto;
}

/* =========================
   CONFIRMAR VENTA
========================= */
async function confirmarVenta() {

    if (!productoSeleccionado) return alert("Selecciona producto");

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const paga = Number(document.getElementById("clientePaga").value);

    const total = cantidad * productoSeleccionado.precio;

    if (paga < total) return alert("No paga suficiente");

    const res = await fetch("/ventas", {
        method: "POST",
        headers: authHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({
            id: productoSeleccionado.id,
            cantidad,
            total
        })
    });

    const data = await res.json();

    if (data.ok) {

        alert("Venta OK");

        cargarProductos();
        cargarHistorial();
        cargarResumen();

        productoSeleccionado = null;

    } else {
        alert(data.mensaje || "Error venta");
    }
}

/* =========================
   HISTORIAL
========================= */
async function cargarHistorial() {

    const res = await fetch("/ventas", {
        headers: authHeaders()
    });

    const data = await res.json();

    let html = "";

    data.forEach(d => {

        let totalDia = 0;

        html += `<div class="producto"><h3>${d.dia}</h3>`;

        d.ventas.forEach(v => {

            totalDia += Number(v.total);

            html += `
            🕒 ${v.hora}<br>
            👤 ${v.vendedor || "Sistema"}<br>
            ${v.producto} x${v.cantidad} = $${v.total}
            <br><br>
            `;
        });

        html += `<b>Total día: $${totalDia}</b></div><br>`;
    });

    document.getElementById("historial").innerHTML = html;
}

/* =========================
   RESUMEN
========================= */
async function cargarResumen() {

    const res = await fetch("/resumen", {
        headers: authHeaders()
    });

    const data = await res.json();

    document.getElementById("totalVentas").innerText = data.ventas;
    document.getElementById("dineroTotal").innerText = "$" + data.dinero;
}

/* =========================
   STOCK / CRUD
========================= */
async function eliminarProducto(id) {
    await fetch("/productos/" + id, { method: "DELETE", headers: authHeaders() });
    cargarProductos();
}

async function agregarStock(id) {
    const cantidad = Number(prompt("Cantidad"));
    await fetch("/stock/" + id, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ cantidad })
    });

    cargarProductos();
}

/* =========================
   PDF
========================= */
function exportarPDF() {
    const contenido = document.getElementById("historial").innerText;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("CIERRE DE CAJA", 10, 10);
    doc.text(contenido, 10, 20);

    doc.save("cierre.pdf");
}

/* =========================
   LOGOUT
========================= */
function cerrarSesion() {
    localStorage.clear();
    window.location = "login.html";
}

/* INIT */
cargarProductos();
cargarHistorial();
cargarResumen();