
const ORDER_HISTORY_COLLECTION = "orders";

function escapeOrderHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function showOrderHistoryMessage(message, isError = false) {
    $("#orderHistoryMessage")
        .text(message)
        .css("color", isError ? "red" : "green");
}

async function loadCustomerOrders() {
    const email = $("#orderCustomerEmail").val().trim().toLowerCase();

    $("#orderHistoryList").empty();
    $("#orderBillDetails").empty();

    if (!email) {
        showOrderHistoryMessage("Please enter your registered email.", true);
        return;
    }

    try {
        showOrderHistoryMessage("Loading your orders...");

        const orders = await queryDocuments(
            ORDER_HISTORY_COLLECTION,
            "CustomerEmail",
            "EQUAL",
            email
        );

        orders.sort((a, b) =>
            new Date(b.OrderDate).getTime() -
            new Date(a.OrderDate).getTime()
        );

        if (orders.length === 0) {
            showOrderHistoryMessage("No orders found for this email.");
            return;
        }

        renderCustomerOrders(orders);
        showOrderHistoryMessage(`${orders.length} order(s) found.`);
    } catch (error) {
        console.error("Order history error:", error);
        showOrderHistoryMessage(
            getFirestoreError(error) || "Unable to load orders.",
            true
        );
    }
}

function renderCustomerOrders(orders) {
    let html = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        const date = order.OrderDate
            ? new Date(order.OrderDate).toLocaleString()
            : "N/A";

        html += `
            <tr>
                <td>${escapeOrderHtml(order.OrderId)}</td>
                <td>${escapeOrderHtml(date)}</td>
                <td>₹${Number(order.Total || 0).toFixed(2)}</td>
                <td>${escapeOrderHtml(order.PaymentMode)}</td>
                <td>${escapeOrderHtml(order.Status)}</td>
                <td>
                    <button
                        type="button"
                        class="view-order-btn"
                        data-order-id="${escapeOrderHtml(order.OrderId)}">
                        View Bill
                    </button>
                </td>
            </tr>
        `;
    });

    html += "</tbody></table>";

    $("#orderHistoryList").html(html);

    // Keep the retrieved orders available for bill display.
    window.customerOrderHistory = orders;
}

function viewOrderBill(orderId) {
    const order = (window.customerOrderHistory || [])
        .find(item => item.OrderId === orderId);

    if (!order) {
        return;
    }

    const date = order.OrderDate
        ? new Date(order.OrderDate).toLocaleString()
        : "N/A";

    let html = `
        <div class="order-bill">
            <h3>Order Bill</h3>

            <p><strong>Order ID:</strong>
                ${escapeOrderHtml(order.OrderId)}</p>

            <p><strong>Customer:</strong>
                ${escapeOrderHtml(order.CustomerName)}</p>

            <p><strong>Email:</strong>
                ${escapeOrderHtml(order.CustomerEmail)}</p>

            <p><strong>Date:</strong>
                ${escapeOrderHtml(date)}</p>

            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    (order.Items || []).forEach(item => {
        html += `
            <tr>
                <td>${escapeOrderHtml(item.ProductName)}</td>
                <td>${Number(item.Quantity || 0)}</td>
                <td>₹${Number(item.Price || 0).toFixed(2)}</td>
                <td>₹${Number(item.Subtotal || 0).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>

            <h3>Total: ₹${Number(order.Total || 0).toFixed(2)}</h3>

            <p><strong>Payment Mode:</strong>
                ${escapeOrderHtml(order.PaymentMode)}</p>

            <p><strong>Status:</strong>
                ${escapeOrderHtml(order.Status)}</p>

            <button type="button" onclick="window.print()">
                Print Bill
            </button>
        </div>
    `;

    $("#orderBillDetails").html(html);
}

$(document).ready(function () {
    $("#loadOrdersBtn").on("click", loadCustomerOrders);

    $("#orderHistoryList").on("click", ".view-order-btn", function () {
        viewOrderBill($(this).data("order-id"));
    });
});
