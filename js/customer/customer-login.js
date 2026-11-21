// Check customer login session
if (window.location.pathname.endsWith("customer.html")) {

    if (sessionStorage.getItem("customerLoggedIn") !== "true") {
        window.location.replace("customer-login.html");
    }

}

$(document).ready(function () {

    $("#customerLoginForm").on("submit", async function (event) {
        event.preventDefault();

        const email = $("#customerEmail").val().trim().toLowerCase();
        const password = $("#customerPassword").val();

        const message = $("#customerLoginMessage");

        message.text("Checking credentials...");

        try {
            // Retrieve customer records from Firestore
            let customers = [];
            let pageToken = null;

            do {
                const response = await getDocuments(
                    "customers",
                    100,
                    pageToken
                );

                customers = customers.concat(response.documents);
                pageToken = response.nextPageToken;

            } while (pageToken);

            // Find customer using email
            const customer = customers.find(function (item) {
                return String(item.Email).toLowerCase() === email;
            });

            // Validate customer credentials
            if (!customer || customer.Password !== password) {
                message.text("Invalid email or password.");
                return;
            }

            // Store customer session details
            sessionStorage.setItem("customerLoggedIn", "true");
            sessionStorage.setItem("customerId", customer.Id);
            sessionStorage.setItem("customerName", customer.Name);
            sessionStorage.setItem("customerEmail", customer.Email);

            message.text("Login successful!");

            // Redirect to shopping page
            window.location.href = "customer.html";

        } catch (error) {
            console.error("Customer login error:", error);
            message.text("Unable to login. Please try again.");
        }
    });

    // Customer logout
    $("#customerLogoutBtn").on("click", function () {

    sessionStorage.removeItem("customerLoggedIn");
    sessionStorage.removeItem("customerId");
    sessionStorage.removeItem("customerName");
    sessionStorage.removeItem("customerEmail");

    window.location.href = "customer-login.html";

  });

});
