const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "../database/minegocio.db"),
    (err) => {

        if (err) {

            console.log(err.message);

        } else {

            console.log("Base de datos conectada");

            // Tabla productos
            db.run(`
                CREATE TABLE IF NOT EXISTS productos (

                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    nombre TEXT NOT NULL,

                    precio REAL NOT NULL,

                    stock INTEGER NOT NULL

                )
            `);

            // Tabla ventas
            db.run(`
                CREATE TABLE IF NOT EXISTS ventas (

                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    producto TEXT,

                    cantidad INTEGER,

                    total REAL,

                    fecha TEXT

                )
            `);
            // Tabla usuarios

db.run(`

CREATE TABLE IF NOT EXISTS usuarios(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuario TEXT UNIQUE,

    password TEXT,

    rol TEXT

)

`);

         

        db.run(

`INSERT OR IGNORE INTO usuarios(usuario,password,rol)

VALUES('admin','9876','admin')`

);



db.run(

`INSERT OR IGNORE INTO usuarios(usuario,password,rol)

VALUES('cajera mauren','4321','cajera')`

);



        }

    }
);

module.exports = db;