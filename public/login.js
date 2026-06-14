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
        alert("Login incorrecto");
        return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("rol", data.rol);

    if (data.rol === "admin") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "cajera.html";
    }
}