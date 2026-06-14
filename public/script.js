const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

let productoSeleccionado = null;

function authHeaders(extra = {}) {
    return {
        "Authorization": "Bearer " + token,
        ...extra
    };
}

/* ================= PRODUCTOS ================= */
async function cargarProductos() {

    const res = await fetch("/productos", {
        headers: authHeaders()
    });

    const productos = await res.json();

    let html = "";

    productos.forEach(p => {

        html += `
        <div>
            <b>${p.nombre}</b> - $${p.precio} - Stock: ${p.stock}
            <button onclick='venderProducto(${JSON.stringify(p)})'>💰</button>
            <button onclick='eliminarProducto(${p.id})'>🗑</button>
        </div>
        `;
    });

    document.getElementById("lista").innerHTML = html;
}

/* ================= VENTA ================= */
function venderProducto(p) {

    productoSeleccionado = p;

    document.getElementById("ventaProducto").innerText = p.nombre;

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

    const cantidad = Number(document.getElementById("cantidadVenta").value);
    const paga = Number(document.getElementById("clientePaga").value);

    const total = cantidad * productoSeleccionado.precio;

    document.getElementById("vuelto").innerText = "$" + (paga - total);
}

/* ================= CONFIRMAR VENTA ================= */
async function confirmarVenta() {

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
        html += `<h3>${d.dia}</h3>`;

        d.ventas.forEach(v => {
            html += `${v.vendedor || "Sistema"} - ${v.producto} x${v.cantidad}<br>`;
        });
    });

    document.getElementById("historial").innerHTML = html;
}

/* ================= STOCK ================= */
async function eliminarProducto(id) {
    await fetch("/productos/" + id, {
        method: "DELETE",
        headers: authHeaders()
    });

    cargarProductos();
}

/* ================= LOGOUT ================= */
function cerrarSesion() {
    localStorage.clear();
    window.location = "login.html";
}

/* INIT */
cargarProductos();
cargarHistorial();