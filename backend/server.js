const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const db = require("./dbPostgres");

const app = express();

const SECRET = "clave_super_secreta_pos";

require("./initDB");
console.log("initDB cargado");


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

/* =========================
   MIDDLEWARE TOKEN
========================= */
function verificarToken(req, res, next) {

    const header = req.headers.authorization;

    if (!header) {
        return res.json({ ok: false, mensaje: "Sin token" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.json({ ok: false, mensaje: "Token inválido o expirado" });
    }
}

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {

    const { usuario, password } = req.body;

    try {
        const result = await db.query(
            "SELECT * FROM usuarios WHERE usuario=$1 AND password=$2",
            [usuario, password]
        );

        const row = result.rows[0];

        if (!row) {
            return res.json({ ok: false, mensaje: "Credenciales incorrectas" });
        }

        const token = jwt.sign(
            {
                id: row.id,
                usuario: row.usuario,
                rol: row.rol
            },
            SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            ok: true,
            token,
            rol: row.rol
        });

    } catch (err) {
        return res.json({ ok: false, mensaje: "Error login" });
    }
});

/* =========================
   PRODUCTOS
========================= */
app.get("/productos", verificarToken, async (req, res) => {

    const result = await db.query("SELECT * FROM productos");
    res.json(result.rows);
});

app.post("/productos", verificarToken, async (req, res) => {

    const { nombre, precio, stock } = req.body;

    await db.query(
        "INSERT INTO productos(nombre,precio,stock) VALUES($1,$2,$3)",
        [nombre, precio, stock]
    );

    res.json({ ok: true });
});

app.put("/productos/:id", verificarToken, async (req, res) => {

    const { nombre, precio, stock } = req.body;

    await db.query(
        "UPDATE productos SET nombre=$1, precio=$2, stock=$3 WHERE id=$4",
        [nombre, precio, stock, req.params.id]
    );

    res.json({ ok: true });
});

app.delete("/productos/:id", verificarToken, async (req, res) => {

    await db.query(
        "DELETE FROM productos WHERE id=$1",
        [req.params.id]
    );

    res.json({ ok: true });
});

app.put("/stock/:id", verificarToken, async (req, res) => {

    const { cantidad } = req.body;

    await db.query(
        "UPDATE productos SET stock = stock + $1 WHERE id=$2",
        [cantidad, req.params.id]
    );

    res.json({ ok: true });
});

/* =========================
   VENTAS
========================= */
app.post("/ventas", verificarToken, async (req, res) => {

    const { id, cantidad, total } = req.body;

    const productoResult = await db.query(
        "SELECT * FROM productos WHERE id=$1",
        [id]
    );

    const producto = productoResult.rows[0];

    if (!producto) {
        return res.json({ ok: false });
    }

    if (producto.stock < cantidad) {
        return res.json({ ok: false, mensaje: "Stock insuficiente" });
    }

    await db.query(
        "UPDATE productos SET stock = stock - $1 WHERE id=$2",
        [cantidad, id]
    );

    await db.query(
    "INSERT INTO ventas(producto,cantidad,total,fecha,vendedor) VALUES($1,$2,$3,now(),$4)",
    [
        producto.nombre,
        cantidad,
        total,
        req.user.usuario
    ]
);

    res.json({ ok: true });
});

/* =========================
   VENTAS AGRUPADAS
========================= */
app.get("/ventas", verificarToken, async (req, res) => {

    const result = await db.query(`
        SELECT
    id,
    producto,
    cantidad,
    total,
    vendedor,
    DATE(fecha) as dia
FROM ventas
        ORDER BY fecha DESC
    `);

    const rows = result.rows;

    const agrupado = {};

    rows.forEach(v => {

        if (!agrupado[v.dia]) {
            agrupado[v.dia] = {
                dia: v.dia,
                ventas: [],
                totalDia: 0
            };
        }

        agrupado[v.dia].ventas.push(v);
        agrupado[v.dia].totalDia += Number(v.total);
    });

    res.json(Object.values(agrupado));
});

/* =========================
   RESUMEN
========================= */
app.get("/resumen", verificarToken, async (req, res) => {

    const result = await db.query(`
        SELECT 
            COUNT(*) as ventas,
            COALESCE(SUM(total),0) as dinero
        FROM ventas
    `);

    res.json(result.rows[0]);
});

/* =========================
   ESTADÍSTICAS
========================= */
app.get("/estadisticas", verificarToken, async (req, res) => {

    const result = await db.query(`
        SELECT
        COALESCE(SUM(CASE WHEN DATE(fecha)=CURRENT_DATE THEN total END),0) as hoy,
        COALESCE(SUM(CASE WHEN TO_CHAR(fecha,'YYYY-MM') = TO_CHAR(NOW(),'YYYY-MM') THEN total END),0) as mes
        FROM ventas
    `);

    res.json(result.rows[0]);
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor iniciado en puerto " + PORT);
});