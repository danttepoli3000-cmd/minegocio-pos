const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();

const SECRET = "clave_super_secreta_pos"; // 🔐 misma clave siempre

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
app.post("/login", (req, res) => {

    const { usuario, password } = req.body;

    db.get(
        "SELECT * FROM usuarios WHERE usuario=? AND password=?",
        [usuario, password],
        (err, row) => {

            if (err || !row) {
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
        }
    );
});

/* =========================
   PRODUCTOS
========================= */
app.get("/productos", verificarToken, (req, res) => {
    db.all("SELECT * FROM productos", (err, rows) => {
        res.json(rows || []);
    });
});

app.post("/productos", verificarToken, (req, res) => {

    const { nombre, precio, stock } = req.body;

    db.run(
        "INSERT INTO productos(nombre,precio,stock) VALUES(?,?,?)",
        [nombre, precio, stock],
        function (err) {
            if (err) return res.json({ ok: false });
            res.json({ ok: true });
        }
    );
});

app.put("/productos/:id", verificarToken, (req, res) => {

    const { nombre, precio, stock } = req.body;

    db.run(
        "UPDATE productos SET nombre=?, precio=?, stock=? WHERE id=?",
        [nombre, precio, stock, req.params.id],
        function (err) {
            if (err) return res.json({ ok: false });
            res.json({ ok: true });
        }
    );
});

app.delete("/productos/:id", verificarToken, (req, res) => {

    db.run(
        "DELETE FROM productos WHERE id=?",
        [req.params.id],
        function (err) {
            if (err) return res.json({ ok: false });
            res.json({ ok: true });
        }
    );
});

app.put("/stock/:id", verificarToken, (req, res) => {

    const { cantidad } = req.body;

    db.run(
        "UPDATE productos SET stock = stock + ? WHERE id=?",
        [cantidad, req.params.id],
        function (err) {
            if (err) return res.json({ ok: false });
            res.json({ ok: true });
        }
    );
});

/* =========================
   VENTAS
========================= */
app.post("/ventas", verificarToken, (req, res) => {

    const { id, cantidad, total } = req.body;

    db.get(
        "SELECT * FROM productos WHERE id=?",
        [id],
        (err, producto) => {

            if (err || !producto) {
                return res.json({ ok: false });
            }

            if (producto.stock < cantidad) {
                return res.json({ ok: false, mensaje: "Stock insuficiente" });
            }

            db.run(
                "UPDATE productos SET stock = stock - ? WHERE id=?",
                [cantidad, id],
                function () {

                    db.run(
                        `INSERT INTO ventas(producto,cantidad,total,fecha)
                         VALUES(?,?,?,datetime('now','localtime'))`,
                        [producto.nombre, cantidad, total],
                        function () {
                            res.json({ ok: true });
                        }
                    );

                }
            );

        }
    );
});

/* =========================
   VENTAS AGRUPADAS
========================= */
app.get("/ventas", verificarToken, (req, res) => {

    db.all(`
        SELECT 
            date(fecha) as dia,
            producto,
            cantidad,
            total,
            fecha
        FROM ventas
        ORDER BY fecha DESC
    `, (err, rows) => {

        if (err) return res.json([]);

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
            agrupado[v.dia].totalDia += v.total;
        });

        res.json(Object.values(agrupado));
    });
});

/* =========================
   RESUMEN
========================= */
app.get("/resumen", verificarToken, (req, res) => {

    db.get(
        `SELECT COUNT(*) as ventas, IFNULL(SUM(total),0) as dinero FROM ventas`,
        (err, row) => {
            if (err) return res.json({ ventas: 0, dinero: 0 });
            res.json(row);
        }
    );
});

/* =========================
   ESTADISTICAS
========================= */
app.get("/estadisticas", verificarToken, (req, res) => {

    db.get(
        `SELECT
        IFNULL(SUM(CASE WHEN date(fecha)=date('now','localtime') THEN total END),0) as hoy,
        IFNULL(SUM(CASE WHEN strftime('%Y-%m',fecha)=strftime('%Y-%m','now','localtime') THEN total END),0) as mes
        FROM ventas`,
        (err, row) => {
            if (err) return res.json({ hoy: 0, mes: 0 });
            res.json(row);
        }
    );
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});