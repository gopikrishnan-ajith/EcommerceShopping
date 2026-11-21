
const CUSTOMER_COLLECTION = "customers";

let editingCustomerId = null;

// Generate a unique customer ID
function generateCustomerId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : "CUS" + Date.now() + Math.floor(Math.random() * 1000);
}

// Load and display customers
function loadCustomers() {
    const tableBody = $("#customerTableBody");

    tableBody.html(
        '<tr><td colspan="6">Loading customers...</td></tr>'
    );

    getDocuments(CUSTOMER_COLLECTION, 100)
        .then(function (result) {
            tableBody.empty();

            if (result.documents.length === 0) {
                tableBody.html(
                    '<tr><td colspan="6">No customers found.</td></tr>'
                );
                return;
            }

            result.documents.forEach(function (customer) {
                const row = $("<tr>");

                row.append($("<td>").text(customer.Id || ""));
                row.append($("<td>").text(customer.Name || ""));
                row.append($("<td>").text(customer.Email || ""));
                row.append($("<td>").text(customer.Mob || ""));
                row.append(
                    $("<td>").text(Number(customer.CreditLimit ?? 0).toFixed(2))
                );

                const actions = $("<td>");

                $("<button>")
                    .text("Edit")
                    .on("click", function () {
                        editCustomer(customer.Id);
                    })
                    .appendTo(actions);

                $("<button>")
                    .text("Delete")
                    .on("click", function () {
                        removeCustomer(customer.Id);
                    })
                    .appendTo(actions);

                actions.appendTo(row);
                tableBody.append(row);
            });
        })
        .catch(function (error) {
            showCustomerMessage(getFirestoreError(error), "error");
            tableBody.empty();
        });
}

// Add or update a customer
function saveCustomer() {
    const name = $("#customerName").val().trim();
    const email = $("#customerEmail").val().trim();
    const mobile = $("#customerMobile").val().trim();
    const creditLimitInput = $("#customerCreditLimit").val();
    const creditLimit = Number(creditLimitInput);

    if (!name || !email || !mobile || creditLimitInput === "") {
        showCustomerMessage(
            "Please complete all customer fields.",
            "error"
        );
        return;
    }

    if (!$("#customerEmail")[0].checkValidity()) {
        showCustomerMessage("Enter a valid email address.", "error");
        return;
    }

    if (!/^[0-9]{10,15}$/.test(mobile)) {
        showCustomerMessage(
            "Enter a valid mobile number containing 10 to 15 digits.",
            "error"
        );
        return;
    }

    if (!Number.isFinite(creditLimit) || creditLimit < 0) {
        showCustomerMessage(
            "Credit limit must be a non-negative number.",
            "error"
        );
        return;
    }

    const customerData = {
        Name: name,
        Email: email,
        Mob: mobile,
        CreditLimit: creditLimit
    };

    $("#saveCustomerBtn").prop("disabled", true);

    getDocuments(CUSTOMER_COLLECTION, 100)
        .then(function (result) {
            const duplicateEmail = result.documents.some(function (customer) {
                return customer.Email?.toLowerCase() === email.toLowerCase()
                    && customer.Id !== editingCustomerId;
            });

            if (duplicateEmail) {
                throw new Error("A customer with this email already exists.");
            }

            if (editingCustomerId) {
                return updateDocument(
                    CUSTOMER_COLLECTION,
                    editingCustomerId,
                    customerData
                );
            }

            const customerId = generateCustomerId();

            return createDocument(
                CUSTOMER_COLLECTION,
                customerId,
                {
                    Id: customerId,
                    ...customerData
                }
            );
        })
        .then(function () {
            showCustomerMessage(
                editingCustomerId
                    ? "Customer updated successfully."
                    : "Customer added successfully.",
                "success"
            );

            resetCustomerForm();
            loadCustomers();
        })
        .catch(function (error) {
            showCustomerMessage(getFirestoreError(error), "error");
        })
        .always(function () {
            $("#saveCustomerBtn").prop("disabled", false);
        });
}

// Retrieve one customer for editing
function editCustomer(customerId) {
    getDocument(CUSTOMER_COLLECTION, customerId)
        .then(function (customer) {
            editingCustomerId = customer.Id;

            $("#customerName").val(customer.Name || "");
            $("#customerEmail").val(customer.Email || "");
            $("#customerMobile").val(customer.Mob || "");
            $("#customerCreditLimit").val(customer.CreditLimit ?? 0);

            $("#customerFormTitle").text("Edit Customer");
            $("#saveCustomerBtn").text("Update Customer");
            $("#cancelCustomerEditBtn").show();
        })
        .catch(function (error) {
            showCustomerMessage(getFirestoreError(error), "error");
        });
}

// Delete a customer
function removeCustomer(customerId) {
    if (!confirm("Are you sure you want to permanently delete this customer?")) {
        return;
    }

    deleteDocument(CUSTOMER_COLLECTION, customerId)
        .then(function () {
            showCustomerMessage(
                "Customer deleted successfully.",
                "success"
            );
            loadCustomers();
        })
        .catch(function (error) {
            showCustomerMessage(getFirestoreError(error), "error");
        });
}

// Reset the form
function resetCustomerForm() {
    editingCustomerId = null;

    $("#customerForm")[0].reset();
    $("#customerCreditLimit").val("0");

    $("#customerFormTitle").text("Add New Customer");
    $("#saveCustomerBtn").text("Add Customer");
    $("#cancelCustomerEditBtn").hide();
}

// Show success or error messages
function showCustomerMessage(message, type) {
    $("#customerMessage")
        .removeClass("success error")
        .addClass(type)
        .text(message)
        .show();
}

// Initialize customer management
$(document).ready(function () {
    loadCustomers();

    $("#customerForm").on("submit", function (event) {
        event.preventDefault();
        saveCustomer();
    });

    $("#cancelCustomerEditBtn").on("click", resetCustomerForm);

    $("#customerCreditLimit").val("0");
});
