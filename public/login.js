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

    // guardar sesión
    localStorage.setItem("token", data.token);
    localStorage.setItem("rol", data.rol);

    // redirección correcta
    if (data.rol === "admin") {
        window.location = "index.html";
    } else {
        window.location = "cajera.html";
    }
}