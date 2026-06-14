localStorage.setItem("token", data.token);
     localStorage.setItem("rol", data.rol);

async function login() {
    

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (!data.ok) {
        alert("Usuario o contraseña incorrectos");
        return;
    }
if (data.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("rol", data.rol);

    window.location = data.rol === "admin"
        ? "index.html"
        : "cajera.html";
}
    // 🔥 ESTO ES LO IMPORTANTE
    localStorage.setItem("rol", data.rol);

    if (data.rol === "admin") {
        window.location = "index.html";
    } else {
        window.location = "cajera.html";
    }
}
