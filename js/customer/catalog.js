
const PRODUCT_COLLECTION = "products";
const CATEGORY_COLLECTION = "categories";

const CATALOG_PAGE_SIZE = 10;

let allShoppingProducts = [];
let displayedShoppingProducts = [];
let catalogCurrentPage = 1;

// Fetch every product page from Firestore
function fetchAllShoppingProducts(pageToken = null, collected = []) {
    return getDocuments(PRODUCT_COLLECTION, 1000, pageToken)
        .then(function (result) {
            collected = collected.concat(result.documents);

            if (result.nextPageToken) {
                return fetchAllShoppingProducts(
                    result.nextPageToken,
                    collected
                );
            }

            return collected;
        });
}

// Load categories into the dropdown
function loadCatalogCategories() {
    getDocuments(CATEGORY_COLLECTION, 100)
        .then(function (result) {
            const dropdown = $("#shopCategory");

            dropdown.empty();
            dropdown.append(
                $("<option>").val("").text("All Categories")
            );

            result.documents.forEach(function (category) {
                dropdown.append(
                    $("<option>")
                        .val(category.Id)
                        .text(category.Name)
                );
            });
        })
        .catch(function (error) {
            showCatalogMessage(getFirestoreError(error), "error");
        });
}

// Load products from Firestore
function loadCatalogProducts() {
    $("#shoppingProductList").html("<p>Loading products...</p>");

    fetchAllShoppingProducts()
        .then(function (products) {
            allShoppingProducts = products.filter(function (product) {
                return product.IsActive !== false;
            });

            filterCatalogProducts();
        })
        .catch(function (error) {
            showCatalogMessage(getFirestoreError(error), "error");
            $("#shoppingProductList").empty();
        });
}

// Search and filter products
function filterCatalogProducts() {
    const searchText = $("#shopSearch").val().trim().toLowerCase();
    const categoryId = $("#shopCategory").val();

    displayedShoppingProducts = allShoppingProducts.filter(
        function (product) {
            const matchesCategory =
                !categoryId || product.Cat_id === categoryId;

            const matchesSearch =
                !searchText ||
                (product.title || "").toLowerCase().includes(searchText) ||
                (product.des || "").toLowerCase().includes(searchText);

            return matchesCategory && matchesSearch;
        }
    );

    catalogCurrentPage = 1;
    renderCatalogProducts();
}

// Display the current product page

function renderCatalogProducts() {
    const container = $("#shoppingProductList");
    container.empty();

    const totalPages = Math.max(
        1,
        Math.ceil(displayedShoppingProducts.length / CATALOG_PAGE_SIZE)
    );

    const startIndex = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;

    const currentProducts = displayedShoppingProducts.slice(
        startIndex,
        startIndex + CATALOG_PAGE_SIZE
    );

    if (currentProducts.length === 0) {
        container.html("<p>No products found.</p>");
    }

    currentProducts.forEach(function (product) {
        const card = $("<div>").addClass("shopping-product-card");

        // Product image
        const imagePath = `assets/products/${product.Id}.jpeg`;

        const productImage = $("<img>")
            .attr({
                src: imagePath,
                alt: product.title || "Product image"
            })
            .addClass("shopping-product-image");

        // Fallback if image is unavailable
        productImage.on("error", function () {
            $(this)
                .attr("src", "assets/products/placeholder.jpg")
                .off("error");
        });

        card.append(productImage);

        $("<h3>")
            .text(product.title || "Unnamed product")
            .appendTo(card);

        $("<p>")
            .text(product.des || "")
            .appendTo(card);

        $("<p>")
            .text("Price: ₹" + Number(product.price || 0).toFixed(2))
            .appendTo(card);

        $("<p>")
            .text("Available stock: " + Number(product.qty || 0))
            .appendTo(card);

        const quantityInput = $("<input>").attr({
            type: "number",
            min: 1,
            max: Number(product.qty || 0),
            value: 1
        });

        card.append(quantityInput);

        $("<button>")
            .text("Add to Cart")
            .prop("disabled", Number(product.qty || 0) <= 0)
            .on("click", function () {
                addToCart(product, Number(quantityInput.val()));
            })
            .appendTo(card);

        container.append(card);
    });

    $("#catalogPageInfo").text(
        `Page ${catalogCurrentPage} of ${totalPages} (${displayedShoppingProducts.length} products)`
    );

    $("#catalogPreviousBtn").prop(
        "disabled",
        catalogCurrentPage <= 1
    );

    $("#catalogNextBtn").prop(
        "disabled",
        catalogCurrentPage >= totalPages
    );
}


// Display catalog messages
function showCatalogMessage(message, type) {
    $("#catalogMessage")
        .removeClass("success error")
        .addClass(type)
        .text(message)
        .show();
}

// Initialize catalog
$(document).ready(function () {
    loadCatalogCategories();
    loadCatalogProducts();

    $("#shopSearch").on("input", filterCatalogProducts);
    $("#shopCategory").on("change", filterCatalogProducts);

    $("#catalogPreviousBtn").on("click", function () {
        if (catalogCurrentPage > 1) {
            catalogCurrentPage--;
            renderCatalogProducts();
        }
    });

    $("#catalogNextBtn").on("click", function () {
        const totalPages = Math.ceil(
            displayedShoppingProducts.length / CATALOG_PAGE_SIZE
        );

        if (catalogCurrentPage < totalPages) {
            catalogCurrentPage++;
            renderCatalogProducts();
        }
    });
});
