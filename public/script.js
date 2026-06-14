const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

let productoSeleccionado = null;

/* ================= AUTH ================= */
function authHeaders(extra = {}) {
    return {
        "Authorization": "Bearer " + token,
        ...extra
    };
}

/* ================= PROTECT ================= */
if (!token || rol !== "admin") {
    window.location.replace("login.html");
}

/* ================= PRODUCTOS ================= */
async function cargarProductos() {

    const res = await fetch("/productos", {
        headers: authHeaders()
    });

    if (!res.ok) return;

    const productos = await res.json();

    let html = "";

    productos.forEach(p => {

        html += `
        <div class="producto">
            <h3>${p.nombre}</h3>
            Precio: $${p.precio}<br>
            Stock: ${p.stock}<br><br>

            <button onclick='venderProducto(${JSON.stringify(p)})'>💰</button>
            <button onclick='eliminarProducto(${p.id})'>🗑</button>
        </div><br>
        `;
    });

    document.getElementById("lista").innerHTML = html;
}

/* ================= VENTA ================= */
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

    document.getElementById("vuelto").innerText = "$" + (paga - total);
}

/* ================= CONFIRMAR VENTA ================= */
async function confirmarVenta() {

    if (!productoSeleccionado) return alert("Selecciona producto");

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const paga = Number(document.getElementById("clientePaga").value);

    const total = cantidad * productoSeleccionado.precio;

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
    }
}

/* ================= HISTORIAL ================= */
async function cargarHistorial() {

    const res = await fetch("/ventas", {
        headers: authHeaders()
    });

    const data = await res.json();

    let html = "";

    data.forEach(d => {

        html += `<div class="producto"><h3>${d.dia}</h3>`;

        d.ventas.forEach(v => {
            html += `
            👤 ${v.vendedor || "Sistema"}<br>
            ${v.producto} x${v.cantidad} = $${v.total}<br><br>
            `;
        });

        html += `</div><br>`;
    });

    document.getElementById("historial").innerHTML = html;
}

/* ================= RESUMEN ================= */
async function cargarResumen() {

    const res = await fetch("/resumen", {
        headers: authHeaders()
    });

    const data = await res.json();

    document.getElementById("totalVentas").innerText = data.ventas;
    document.getElementById("dineroTotal").innerText = "$" + data.dinero;
}

/* ================= STOCK ================= */
async function eliminarProducto(id) {
    await fetch("/productos/" + id, {
        method: "DELETE",
        headers: authHeaders()
    });

    cargarProductos();
}

/* ================= INIT ================= */
cargarProductos();
cargarHistorial();
cargarResumen();

/* ================= LOGOUT ================= */
function cerrarSesion() {
    localStorage.clear();
    window.location.replace("login.html");
}