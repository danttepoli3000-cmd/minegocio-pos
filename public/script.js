const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

if (!token || rol !== "admin") {
    window.location = "login.html";
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
                Stock: ${p.stock}<br><br>

                <button onclick='editarProducto(${p.id}, "${p.nombre}", ${p.precio}, ${p.stock})'>✏️</button>
                <button onclick='agregarStock(${p.id})'>➕</button>
                <button onclick='eliminarProducto(${p.id})'>🗑</button>
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

        html += `<div class="producto"><h3>${d.dia}</h3>`;

        d.ventas.forEach(v => {
            html += `${v.producto} x${v.cantidad} = $${v.total}<br>`;
        });

        html += `</div><br>`;
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

/* INIT */
cargarProductos();
cargarHistorial();
cargarResumen();
cargarEstadisticas();

function cerrarSesion() {
    localStorage.clear();
    window.location = "login.html";
}