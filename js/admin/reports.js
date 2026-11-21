
let inventoryReportProducts = [];
let inventoryReportCategories = [];

function reportEscape(value) {
    return $("<div>").text(value ?? "").html();
}
async function loadInventoryReportData() {
    try {
        const [productResponse, categoryResponse] = await Promise.all([
            getDocuments("products", 1000),
            getDocuments("categories", 1000)
        ]);

        inventoryReportProducts = productResponse.documents;
        inventoryReportCategories = categoryResponse.documents;

        populateInventoryCategoryFilter();
        generateInventoryReport();

    } catch (error) {
        console.error("Inventory report error:", error);

        $("#inventoryReportMessage").text(
            getFirestoreError(error) || "Unable to load inventory data."
        );
    }
}


function populateInventoryCategoryFilter() {
    const dropdown = $("#inventoryReportCategory");

    dropdown.empty();
    dropdown.append('<option value="">All Categories</option>');

    inventoryReportCategories.forEach(category => {
        dropdown.append(
            $("<option></option>")
                .val(category.Id)
                .text(category.Name)
        );
    });
}

function generateInventoryReport(reportType) {
    const selectedCategory = $("#inventoryReportCategory").val();

    let products = [...inventoryReportProducts];

    if (selectedCategory) {
        products = products.filter(
            product => product.Cat_id === selectedCategory
        );
    }

    if (reportType === "high") {
        products = products.filter(product => Number(product.qty) > 100);
    } else if (reportType === "low") {
        products = products.filter(product => Number(product.qty) < 15);
    }

    renderInventoryReport(products);

    $("#inventoryReportMessage").text(
        `${products.length} product(s) found.`
    );
}

function renderInventoryReport(products) {
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Stock Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (products.length === 0) {
        html += `
            <tr>
                <td colspan="6">No products found.</td>
            </tr>
        `;
    }

    products.forEach(product => {
        const category = inventoryReportCategories.find(
            item => item.Id === product.Cat_id
        );

        const quantity = Number(product.qty || 0);

        let status = "Normal";

        if (quantity > 100) {
            status = "High Stock";
        } else if (quantity < 15) {
            status = "Low Stock";
        }

        html += `
            <tr>
                <td>${escapeHtml(product.Id)}</td>
                <td>${escapeHtml(product.title)}</td>
                <td>${escapeHtml(category?.Name || "Unknown")}</td>
                <td>${quantity}</td>
                <td>₹${Number(product.price || 0).toFixed(2)}</td>
                <td>${status}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    $("#inventoryReportTable").html(html);
}

$(document).ready(function () {
    loadInventoryReportData();

    $("#inventoryReportType").on("change", function () {
        generateInventoryReport($(this).val());
    });

    $("#inventoryReportCategory").on("change", function () {
        generateInventoryReport($("#inventoryReportType").val());
    });
});



// ---------------- SALES REPORTS ----------------

let salesReportOrders = [];
let salesReportProducts = [];
let salesReportCategories = [];

function getOrderDateString(orderDate) {
    let date;

    if (orderDate instanceof Date) {
        date = orderDate;
    } else if (typeof orderDate === "string" || typeof orderDate === "number") {
        date = new Date(orderDate);
    } else if (orderDate && orderDate.seconds) {
        date = new Date(orderDate.seconds * 1000);
    } else {
        return "";
    }

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

async function loadSalesReportData() {
    try {
        const [orderResponse, productResponse, categoryResponse] =
            await Promise.all([
                getDocuments("orders", 1000),
                getDocuments("products", 1000),
                getDocuments("categories", 1000)
            ]);

        salesReportOrders = orderResponse.documents;
        salesReportProducts = productResponse.documents;
        salesReportCategories = categoryResponse.documents;

        populateSalesCategoryFilter();
        generateSalesReport();

    } catch (error) {
        console.error("Sales report error:", error);

        $("#salesReportMessage").text(
            getFirestoreError(error) || "Unable to load sales reports."
        );
    }
}

function populateSalesCategoryFilter() {
    const dropdown = $("#salesReportCategory");

    dropdown.empty();
    dropdown.append('<option value="">All Categories</option>');

    salesReportCategories.forEach(category => {
        dropdown.append(
            $("<option></option>")
                .val(category.Id)
                .text(category.Name)
        );
    });
}

function getFilteredSalesOrders() {
    const fromDate = $("#salesFromDate").val();
    const toDate = $("#salesToDate").val();

    return salesReportOrders.filter(order => {
        const orderDate = getOrderDateString(order.OrderDate);

        if (!orderDate) return false;
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;

        return true;
    });
}

function generateSalesReport() {
    const reportType = $("#salesReportType").val();
    const selectedCategory = $("#salesReportCategory").val();

    let orders = getFilteredSalesOrders();

    if (reportType === "cash") {
        orders = orders.filter(order => order.PaymentMode === "Cash");
    } else if (reportType === "credit") {
        orders = orders.filter(order => order.PaymentMode === "Credit");
    }

    if (reportType === "category") {
        renderCategorySalesReport(orders);
    } else if (reportType === "top" || reportType === "bottom") {
        renderBestSellingItems(orders, reportType, selectedCategory);
    } else {
        renderOrderSalesReport(orders);
    }

    $("#salesReportMessage").text(
        `${orders.length} matching order(s) found.`
    );
}

function renderOrderSalesReport(orders) {
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Payment Mode</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (orders.length === 0) {
        html += `<tr><td colspan="5">No sales found.</td></tr>`;
    }

    orders.forEach(order => {
        html += `
            <tr>
                <td>${reportEscape(order.OrderId)}</td>
                <td>${reportEscape(order.CustomerName)}</td>
                <td>${getOrderDateString(order.OrderDate)}</td>
                <td>${reportEscape(order.PaymentMode)}</td>
                <td>₹${Number(order.Total || 0).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    $("#salesReportTable").html(html);
}

function renderCategorySalesReport(orders) {
    const categoryTotals = {};

    orders.forEach(order => {
        (order.Items || []).forEach(item => {
            const product = salesReportProducts.find(
                product => product.Id === item.ProductId
            );

            if (!product) return;

            const category = salesReportCategories.find(
                category => category.Id === product.Cat_id
            );

            const categoryId = product.Cat_id || "UNKNOWN";
            const categoryName = category?.Name || "Unknown";

            if (!categoryTotals[categoryId]) {
                categoryTotals[categoryId] = {
                    name: categoryName,
                    quantity: 0,
                    revenue: 0
                };
            }

            const quantity = Number(item.Quantity || 0);
            const subtotal = Number(
                item.Subtotal || (Number(item.Price || 0) * quantity)
            );

            categoryTotals[categoryId].quantity += quantity;
            categoryTotals[categoryId].revenue += subtotal;
        });
    });

    const rows = Object.values(categoryTotals);

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Total Sales</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (rows.length === 0) {
        html += `<tr><td colspan="3">No category sales found.</td></tr>`;
    }

    rows.forEach(row => {
        html += `
            <tr>
                <td>${reportEscape(row.name)}</td>
                <td>${row.quantity}</td>
                <td>₹${row.revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    $("#salesReportTable").html(html);
}

function renderBestSellingItems(orders, reportType, selectedCategory) {
    const itemTotals = {};

    orders.forEach(order => {
        (order.Items || []).forEach(item => {
            const product = salesReportProducts.find(
                product => product.Id === item.ProductId
            );

            if (!product) return;

            if (selectedCategory && product.Cat_id !== selectedCategory) {
                return;
            }

            const productId = item.ProductId;

            if (!itemTotals[productId]) {
                itemTotals[productId] = {
                    id: productId,
                    name: product.title || item.ProductName,
                    quantity: 0,
                    revenue: 0
                };
            }

            const quantity = Number(item.Quantity || 0);
            const subtotal = Number(
                item.Subtotal || (Number(item.Price || 0) * quantity)
            );

            itemTotals[productId].quantity += quantity;
            itemTotals[productId].revenue += subtotal;
        });
    });

    let items = Object.values(itemTotals);

    items.sort((a, b) => {
        if (reportType === "top") {
            return b.quantity - a.quantity;
        }

        return a.quantity - b.quantity;
    });

    items = items.slice(0, 10);

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Units Sold</th>
                    <th>Total Sales</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (items.length === 0) {
        html += `<tr><td colspan="4">No item sales found.</td></tr>`;
    }

    items.forEach(item => {
        html += `
            <tr>
                <td>${reportEscape(item.id)}</td>
                <td>${reportEscape(item.name)}</td>
                <td>${item.quantity}</td>
                <td>₹${item.revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    $("#salesReportTable").html(html);
}

$(document).ready(function () {
    loadSalesReportData();

    $("#salesReportType, #salesReportCategory").on(
        "change",
        generateSalesReport
    );

    $("#salesFromDate, #salesToDate").on(
        "change",
        generateSalesReport
    );
});
