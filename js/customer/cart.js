
let shoppingCart = [];

// Add a product to the cart
function addToCart(product, quantity) {
    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > Number(product.qty || 0)
    ) {
        showCartMessage("Please enter a valid quantity.", "error");
        return;
    }

    const existingItem = shoppingCart.find(function (item) {
        return item.Id === product.Id;
    });

    const newQuantity = existingItem
        ? existingItem.quantity + quantity
        : quantity;

    if (newQuantity > Number(product.qty || 0)) {
        showCartMessage(
            "Requested quantity exceeds available stock.",
            "error"
        );
        return;
    }

    if (existingItem) {
        existingItem.quantity = newQuantity;
    } else {
        shoppingCart.push({
            Id: product.Id,
            title: product.title,
            price: Number(product.price),
            quantity: quantity,
            availableStock: Number(product.qty)
        });
    }

    renderShoppingCart();
    showCartMessage("Product added to cart.", "success");
}

// Update the quantity of a cart item
function updateCartQuantity(productId, quantity) {
    const item = shoppingCart.find(function (cartItem) {
        return cartItem.Id === productId;
    });

    if (!item) return;

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > item.availableStock
    ) {
        showCartMessage("Invalid quantity.", "error");
        renderShoppingCart();
        return;
    }

    item.quantity = quantity;
    renderShoppingCart();
}

// Remove an item from the cart
function removeFromCart(productId) {
    shoppingCart = shoppingCart.filter(function (item) {
        return item.Id !== productId;
    });

    renderShoppingCart();
    showCartMessage("Product removed from cart.", "success");
}

// Calculate the cart total
function calculateCartTotal() {
    return shoppingCart.reduce(function (total, item) {
        return total + item.price * item.quantity;
    }, 0);
}

// Display cart items
function renderShoppingCart() {
    const container = $("#shoppingCartItems");
    container.empty();

    if (shoppingCart.length === 0) {
        container.html("<p>Your cart is empty.</p>");
        $("#cartTotal").text("₹0.00");
        $("#proceedToCheckoutBtn").prop("disabled", true);
        return;
    }

    shoppingCart.forEach(function (item) {
        const subtotal = item.price * item.quantity;
        const cartItem = $("<div>").addClass("cart-item");

        $("<h4>")
            .text(item.title)
            .appendTo(cartItem);

        $("<p>")
            .text(
                `₹${item.price.toFixed(2)} × ${item.quantity} = ₹${subtotal.toFixed(2)}`
            )
            .appendTo(cartItem);

        const quantityInput = $("<input>").attr({
            type: "number",
            min: 1,
            max: item.availableStock,
            value: item.quantity
        });

        quantityInput.on("change", function () {
            updateCartQuantity(
                item.Id,
                Number($(this).val())
            );
        });

        cartItem.append(quantityInput);

        $("<button>")
            .text("Remove")
            .on("click", function () {
                removeFromCart(item.Id);
            })
            .appendTo(cartItem);

        container.append(cartItem);
    });

    $("#cartTotal").text(
        "₹" + calculateCartTotal().toFixed(2)
    );

    $("#proceedToCheckoutBtn").prop("disabled", false);
}

// Display cart messages
function showCartMessage(message, type) {
    $("#cartMessage")
        .removeClass("success error")
        .addClass(type)
        .text(message)
        .show();
}

// Initialize cart display
$(document).ready(function () {
    renderShoppingCart();
});
