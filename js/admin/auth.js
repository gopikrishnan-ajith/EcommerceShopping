
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@123";

function isAdminLoggedIn() {
    return sessionStorage.getItem("adminLoggedIn") === "true";
}

// Protect the admin page
if (
    window.location.pathname.endsWith("/admin.html") ||
    window.location.pathname.endsWith("admin.html")
) {
    if (!isAdminLoggedIn()) {
        window.location.replace("admin-login.html");
    }
}

// Logout
function adminLogout() {
    sessionStorage.removeItem("adminLoggedIn");
    window.location.replace("admin-login.html");
}
