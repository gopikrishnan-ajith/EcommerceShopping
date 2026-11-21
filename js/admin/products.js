
const PRODUCT_COLLECTION = "products";
const PRODUCT_PAGE_SIZE = 10;

let editingProductId = null;
let productPageToken = null;
let productPreviousTokens = [];
let filteredProducts = [];
let filteredPage = 0;
let isCategoryFilterActive = false;

// Generate a unique product ID
function generateProductId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : "PROD" + Date.now() + Math.floor(Math.random() * 1000);
}

// Load categories into the product form and filter
function loadProductCategories() {
    getDocuments("categories", 100)
        .then(function (result) {
            const categories = result.documents;

            $("#productCategory, #productCategoryFilter").empty();

            $("#productCategory").append(
                '<option value="">Select Category</option>'
            );

            $("#productCategoryFilter").append(
                '<option value="">All Categories</option>'
            );

            categories.forEach(function (category) {
                const option = $("<option>")
                    .val(category.Id)
                    .text(category.Name);

                $("#productCategory").append(option.clone());
                $("#productCategoryFilter").append(option);
            });
        })
        .catch(function (error) {
            showProductMessage(getFirestoreError(error), "error");
        });
}

// Load products from Firestore
function loadProducts() {
    isCategoryFilterActive = false;
    productPreviousTokens = [];
    productPageToken = null;

    const categoryId = $("#productCategoryFilter").val();

    if (categoryId) {
        isCategoryFilterActive = true;
        filteredPage = 0;

        queryDocuments(
            PRODUCT_COLLECTION,
            "Cat_id",
            "EQUAL",
            categoryId
        )
            .then(function (products) {
                filteredProducts = products;
                renderFilteredProducts();
            })
            .catch(function (error) {
                showProductMessage(getFirestoreError(error), "error");
            });

        return;
    }

    loadProductPage(null);
}

// Load one server-paginated product page
function loadProductPage(pageToken) {
    $("#productTableBody").html(
        '<tr><td colspan="7">Loading products...</td></tr>'
    );

    getDocuments(PRODUCT_COLLECTION, PRODUCT_PAGE_SIZE, pageToken)
        .then(function (result) {
            renderProductRows(result.documents);

            $("#productPageInfo").text("Products page");

            $("#previousProductPageBtn")
                .prop("disabled", productPreviousTokens.length === 0);

            $("#nextProductPageBtn")
                .prop("disabled", !result.nextPageToken);

            $("#nextProductPageBtn").data(
                "next-token",
                result.nextPageToken
            );
        })
        .catch(function (error) {
            showProductMessage(getFirestoreError(error), "error");
        });
}

// Render products returned by category filtering
function renderFilteredProducts() {
    const start = filteredPage * PRODUCT_PAGE_SIZE;
    const pageProducts = filteredProducts.slice(
        start,
        start + PRODUCT_PAGE_SIZE
    );

    renderProductRows(pageProducts);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE)
    );

    $("#productPageInfo").text(
        `Page ${filteredPage + 1} of ${totalPages}`
    );

    $("#previousProductPageBtn").prop("disabled", filteredPage === 0);

    $("#nextProductPageBtn").prop(
        "disabled",
        filteredPage >= totalPages - 1
    );
}

// Render product rows
function renderProductRows(products) {
    const tableBody = $("#productTableBody");
    tableBody.empty();

    if (products.length === 0) {
        tableBody.html(
            '<tr><td colspan="7">No products found.</td></tr>'
        );
        return;
    }

    products.forEach(function (product) {
        const isActive = product.IsActive !== false;

        const row = $("<tr>");

        row.append($("<td>").text(product.Id || ""));
        row.append($("<td>").text(product.title || ""));
        row.append($("<td>").text(product.Cat_id || ""));
        row.append($("<td>").text(product.qty ?? 0));
        row.append($("<td>").text(product.price ?? 0));
        row.append($("<td>").text(isActive ? "Active" : "Inactive"));

        const actions = $("<td>");

        $("<button>")
            .text("Edit")
            .on("click", function () {
                editProduct(product.Id);
            })
            .appendTo(actions);

        $("<button>")
            .text(isActive ? "Deactivate" : "Activate")
            .on("click", function () {
                changeProductStatus(product.Id, !isActive);
            })
            .appendTo(actions);

        $("<button>")
            .text("Delete")
            .on("click", function () {
                removeProduct(product.Id);
            })
            .appendTo(actions);

        actions.appendTo(row);
        tableBody.append(row);
    });
}

// Add or update a product
function saveProduct() {
    const title = $("#productTitle").val().trim();
    const description = $("#productDescription").val().trim();
    const categoryId = $("#productCategory").val();
    const quantity = Number($("#productQuantity").val());
    const price = Number($("#productPrice").val());

    if (!title || !description || !categoryId) {
        showProductMessage(
            "Please complete all product fields.",
            "error"
        );
        return;
    }

    if (
        $("#productQuantity").val() === "" ||
        !Number.isInteger(quantity) ||
        quantity < 0
    ) {
        showProductMessage(
            "Quantity must be a non-negative whole number.",
            "error"
        );
        return;
    }

    if (
        $("#productPrice").val() === "" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        showProductMessage(
            "Enter a valid non-negative price.",
            "error"
        );
        return;
    }

    const productData = {
        Cat_id: categoryId,
        title: title,
        des: description,
        qty: quantity,
        price: price
    };

    $("#saveProductBtn").prop("disabled", true);

    let request;

    if (editingProductId) {
        request = updateDocument(
            PRODUCT_COLLECTION,
            editingProductId,
            productData
        );
    } else {
        const productId = generateProductId();

        request = createDocument(
            PRODUCT_COLLECTION,
            productId,
            {
                Id: productId,
                ...productData,
                IsActive: true
            }
        );
    }

    request
        .then(function () {
            showProductMessage(
                editingProductId
                    ? "Product updated successfully."
                    : "Product added successfully.",
                "success"
            );

            resetProductForm();
            loadProducts();
        })
        .catch(function (error) {
            showProductMessage(getFirestoreError(error), "error");
        })
        .always(function () {
            $("#saveProductBtn").prop("disabled", false);
        });
}

// Read one product and populate the edit form
function editProduct(productId) {
    getDocument(PRODUCT_COLLECTION, productId)
        .then(function (product) {
            editingProductId = product.Id;

            $("#productTitle").val(product.title || "");
            $("#productDescription").val(product.des || "");
            $("#productCategory").val(product.Cat_id || "");
            $("#productQuantity").val(product.qty ?? 0);
            $("#productPrice").val(product.price ?? 0);

            $("#productFormTitle").text("Edit Product");
            $("#saveProductBtn").text("Update Product");
            $("#cancelProductEditBtn").show();

            $("#productTitle").focus();
        })
        .catch(function (error) {
            showProductMessage(getFirestoreError(error), "error");
        });
}

// Activate or deactivate a product
function changeProductStatus(productId, isActive) {
    const action = isActive ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this product?`)) {
        return;
    }

    updateDocument(
        PRODUCT_COLLECTION,
        productId,
        { IsActive: isActive }
    )
        .then(function () {
            showProductMessage(
                `Product ${action}d successfully.`,
                "success"
            );
            loadProducts();
        })
        .catch(function (error) {
            showProductMessage(getFirestoreError(error), "error");
        });
}

// Permanently delete a product
function removeProduct(productId) {
    if (!confirm("Permanently delete this product?")) {
        return;
    }

    deleteDocument(PRODUCT_COLLECTION, productId)
        .then(function () {
            showProductMessage("Product deleted successfully.", "success");
            loadProducts();
        })
        .catch(function (error) {
            showProductMessage(getFirestoreError(error), "error");
        });
}

// Find an individual product using its ID
function findProductById() {
    const productId = $("#productSearchId").val().trim();

    if (!productId) {
        showProductMessage("Enter a product ID.", "error");
        return;
    }

    getDocument(PRODUCT_COLLECTION, productId)
        .then(function (product) {
            renderProductRows([product]);

            $("#productPageInfo").text("Individual product result");
            $("#previousProductPageBtn").prop("disabled", true);
            $("#nextProductPageBtn").prop("disabled", true);
        })
        .catch(function (error) {
            if (error.status === 404) {
                showProductMessage("Product not found.", "error");
            } else {
                showProductMessage(getFirestoreError(error), "error");
            }
        });
}

// Reset the product form
function resetProductForm() {
    editingProductId = null;

    $("#productForm")[0].reset();
    $("#productFormTitle").text("Add New Product");
    $("#saveProductBtn").text("Add Product");
    $("#cancelProductEditBtn").hide();
}

// Display messages
function showProductMessage(message, type) {
    $("#productMessage")
        .removeClass("success error")
        .addClass(type)
        .text(message)
        .show();
}

// Initialize product management
$(document).ready(function () {
    loadProductCategories();
    loadProducts();

    $("#productForm").on("submit", function (event) {
        event.preventDefault();
        saveProduct();
    });

    $("#cancelProductEditBtn").on("click", resetProductForm);

    $("#productCategoryFilter").on("change", loadProducts);

    $("#searchProductBtn").on("click", findProductById);

    $("#clearProductSearchBtn").on("click", function () {
        $("#productSearchId").val("");
        loadProducts();
    });

    $("#previousProductPageBtn").on("click", function () {
        if (isCategoryFilterActive) {
            if (filteredPage > 0) {
                filteredPage--;
                renderFilteredProducts();
            }
            return;
        }

        if (productPreviousTokens.length > 0) {
            productPageToken = productPreviousTokens.pop();
            loadProductPage(productPageToken);
        }
    });

    $("#nextProductPageBtn").on("click", function () {
        if (isCategoryFilterActive) {
            const totalPages = Math.ceil(
                filteredProducts.length / PRODUCT_PAGE_SIZE
            );

            if (filteredPage < totalPages - 1) {
                filteredPage++;
                renderFilteredProducts();
            }
            return;
        }

        const nextToken = $(this).data("next-token");

        if (nextToken) {
            productPreviousTokens.push(productPageToken);
            productPageToken = nextToken;
            loadProductPage(productPageToken);
        }
    });
});
