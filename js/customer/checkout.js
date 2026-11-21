
const ORDER_COLLECTION = "orders";
const CHECKOUT_CUSTOMER_COLLECTION = "customers";

// Generate a unique order ID
function generateOrderId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : "ORD" + Date.now() + Math.floor(Math.random() * 1000);
}

// Open checkout
function openCheckout() {
    if (shoppingCart.length === 0) {
        alert("Your shopping cart is empty.");
        return;
    }

    $("#checkoutSection").slideDown();
    $("#checkoutEmail").focus();
}

// Place an order
function placeOrder() {
    if (shoppingCart.length === 0) {
        showCheckoutMessage("Your cart is empty.", "error");
        return;
    }

    const email = $("#checkoutEmail").val().trim().toLowerCase();
    const paymentMode = $("#paymentMode").val();

    if (!email) {
        showCheckoutMessage("Enter your registered email.", "error");
        return;
    }

    if (!["Cash", "Credit"].includes(paymentMode)) {
        showCheckoutMessage("Select a valid payment method.", "error");
        return;
    }

    $("#placeOrderBtn").prop("disabled", true);

    // Find the registered customer
    queryDocuments(
        CHECKOUT_CUSTOMER_COLLECTION,
        "Email",
        "EQUAL",
        email
    )
        .then(function (customers) {
            if (customers.length === 0) {
                throw new Error(
                    "No customer found with this email. Please contact the administrator to register."
                );
            }

            if (customers.length > 1) {
                throw new Error(
                    "Multiple customer records use this email. Please contact the administrator."
                );
            }

            const customer = customers[0];

            // Fetch current product records before calculating the order
            return Promise.all(
                shoppingCart.map(function (cartItem) {
                    return getDocument(
                        "products",
                        cartItem.Id
                    );
                })
            ).then(function (currentProducts) {
                return {
                    customer: customer,
                    products: currentProducts
                };
            });
        })
        .then(function (data) {
            const customer = data.customer;
            const currentProducts = data.products;

            let total = 0;
            const orderItems = [];
            const operations = [];

            // Validate stock and prepare stock updates
            currentProducts.forEach(function (product) {
                const cartItem = shoppingCart.find(function (item) {
                    return item.Id === product.Id;
                });

                if (!product || product.IsActive === false) {
                    throw new Error(
                        `Product ${product.Id} is no longer available.`
                    );
                }

                const availableStock = Number(product.qty || 0);

                if (
                    !Number.isInteger(cartItem.quantity) ||
                    cartItem.quantity < 1 ||
                    cartItem.quantity > availableStock
                ) {
                    throw new Error(
                        `Insufficient stock for ${product.title}. Available: ${availableStock}.`
                    );
                }

                const price = Number(product.price);
                const subtotal = price * cartItem.quantity;

                if (!Number.isFinite(price) || price < 0) {
                    throw new Error(
                        `Invalid price for ${product.title}.`
                    );
                }

                total += subtotal;

                orderItems.push({
                    ProductId: product.Id,
                    ProductName: product.title,
                    Quantity: cartItem.quantity,
                    Price: price,
                    Subtotal: subtotal
                });

                operations.push({
                    type: "update",
                    collection: "products",
                    documentId: product.Id,
                    data: {
                        qty: availableStock - cartItem.quantity
                    }
                });
            });

            // Check available customer credit
            const creditLimit = Number(customer.CreditLimit || 0);
            const creditUsed = Number(customer.CreditUsed || 0);
            const availableCredit = creditLimit - creditUsed;

            if (paymentMode === "Credit" && total > availableCredit) {
                throw new Error(
                    `Insufficient credit. Available credit: ₹${availableCredit.toFixed(2)}. Order total: ₹${total.toFixed(2)}.`
                );
            }

            // Update credit used for credit purchases
            if (paymentMode === "Credit") {
                operations.push({
                    type: "update",
                    collection: "customers",
                    documentId: customer.Id,
                    data: {
                        CreditUsed: creditUsed + total
                    }
                });
            }

            // Create the order document
            const orderId = generateOrderId();

            const order = {
                OrderId: orderId,
                CustomerId: customer.Id,
                CustomerName: customer.Name,
                CustomerEmail: customer.Email,
                OrderDate: new Date(),
                Items: orderItems,
                Total: total,
                PaymentMode: paymentMode,
                Status: "Confirmed"
            };

            operations.push({
                type: "create",
                collection: ORDER_COLLECTION,
                documentId: orderId,
                data: order
            });

            // Commit stock, credit and order changes together
            return commitDocumentBatch(operations).then(function () {
                return {
                    orderId: orderId,
                    total: total,
                    paymentMode: paymentMode
                };
            });
        })
        .then(function (result) {
            shoppingCart = [];
            renderShoppingCart();

            $("#checkoutForm")[0].reset();
            $("#checkoutSection").slideUp();

            showCheckoutMessage(
                `Order placed successfully! Order ID: ${result.orderId}. Total: ₹${result.total.toFixed(2)}. Payment: ${result.paymentMode}.`,
                "success"
            );

            loadCatalogProducts();
        })
        .catch(function (error) {
            showCheckoutMessage(
                error.responseJSON?.error?.message ||
                getFirestoreError(error),
                "error"
            );
        })
        .always(function () {
            $("#placeOrderBtn").prop("disabled", false);
        });
}

// Display checkout messages
function showCheckoutMessage(message, type) {
    $("#checkoutMessage")
        .removeClass("success error")
        .addClass(type)
        .text(message)
        .show();
}

// Initialize checkout
$(document).ready(function () {
    $("#proceedToCheckoutBtn").on("click", openCheckout);

    $("#checkoutForm").on("submit", function (event) {
        event.preventDefault();
        placeOrder();
    });

    $("#cancelCheckoutBtn").on("click", function () {
        $("#checkoutSection").slideUp();
    });
});
