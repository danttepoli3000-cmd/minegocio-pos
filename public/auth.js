(function () {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    const path = window.location.pathname;

    // si no hay login → siempre login
    if (!token) {
        if (path !== "/login.html") {
            window.location.replace("login.html");
        }
        return;
    }

    // admin page
    if (path.includes("admin") && rol !== "admin") {
        window.location.replace("login.html");
    }

    // cajera page
    if (path.includes("cajera") && rol !== "cajera") {
        window.location.replace("login.html");
    }
})();