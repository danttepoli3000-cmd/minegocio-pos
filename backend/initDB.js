const db = require("./dbPostgres");

async function init() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                usuario TEXT UNIQUE,
                password TEXT,
                rol TEXT
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre TEXT,
                precio NUMERIC,
                stock INTEGER
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS ventas (
                id SERIAL PRIMARY KEY,
                producto TEXT,
                cantidad INTEGER,
                total NUMERIC,
                fecha TIMESTAMP DEFAULT NOW()
            );
        `);
await db.query(`
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS vendedor TEXT;
`);


        await db.query(`
        INSERT INTO usuarios(usuario,password,rol)
        VALUES('admin','9876','admin')
        ON CONFLICT(usuario) DO NOTHING;
        `);


       await db.query(`
       INSERT INTO usuarios(usuario,password,rol)
       VALUES('cajera','4321','cajera')
       ON CONFLICT(usuario) DO NOTHING;
       `);

        console.log("✔ BD inicializada correctamente");
    } catch (err) {
        console.error(err);
    }
}

init();