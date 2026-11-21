
$(document).ready(function () {
    $("#adminLoginForm").on("submit", function (event) {
        event.preventDefault();

        const username = $("#adminName").val().trim();
        const password = $("#adminPassword").val();

        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {
            sessionStorage.setItem("adminLoggedIn", "true");
            window.location.href = "admin.html";
        } else {
            $("#loginMessage").text("Invalid admin name or password.");
        }
    });
});
