
const CATEGORY_COLLECTION = "categories";

let editingCategoryId = null;

// Generate a unique ID for each category
function generateCategoryId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "CAT" + Date.now() + Math.floor(Math.random() * 1000);
}

// Load all categories
function loadCategories() {
    const tableBody = $("#categoryTableBody");

    tableBody.html(`
        <tr>
            <td colspan="3">Loading categories...</td>
        </tr>
    `);

    getDocuments(CATEGORY_COLLECTION, 100)
        .then(function (result) {
            tableBody.empty();

            if (result.documents.length === 0) {
                tableBody.html(`
                    <tr>
                        <td colspan="3">No categories found.</td>
                    </tr>
                `);
                return;
            }

            result.documents.forEach(function (category) {
                const row = `
                    <tr>
                        <td>${escapeHtml(category.Id)}</td>
                        <td>${escapeHtml(category.Name)}</td>
                        <td>
                            <button onclick="editCategory('${category.Id}')">
                                Edit
                            </button>

                            <button onclick="removeCategory('${category.Id}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;

                tableBody.append(row);
            });
        })
        .catch(function (error) {
            showCategoryMessage(getFirestoreError(error), "error");
            tableBody.empty();
        });
}

// Escape user-entered text before displaying it
function escapeHtml(value) {
    return $("<div>").text(String(value ?? "")).html();
}

// Add or update a category
function saveCategory() {
    const categoryName = $("#categoryName").val().trim();

    if (!categoryName) {
        showCategoryMessage("Please enter a category name.", "error");
        return;
    }

    $("#saveCategoryBtn").prop("disabled", true);

    getDocuments(CATEGORY_COLLECTION, 100)
        .then(function (result) {
            const duplicate = result.documents.some(function (category) {
                return category.Name?.toLowerCase() === categoryName.toLowerCase()
                    && category.Id !== editingCategoryId;
            });

            if (duplicate) {
                throw new Error("This category already exists.");
            }

            if (editingCategoryId) {
                return updateDocument(
                    CATEGORY_COLLECTION,
                    editingCategoryId,
                    { Name: categoryName }
                );
            }

            const categoryId = generateCategoryId();

            return createDocument(
                CATEGORY_COLLECTION,
                categoryId,
                {
                    Id: categoryId,
                    Name: categoryName
                }
            );
        })
        .then(function () {
            showCategoryMessage(
                editingCategoryId
                    ? "Category updated successfully."
                    : "Category added successfully.",
                "success"
            );

            resetCategoryForm();
            loadCategories();
        })
        .catch(function (error) {
            showCategoryMessage(getFirestoreError(error), "error");
        })
        .always(function () {
            $("#saveCategoryBtn").prop("disabled", false);
        });
}

// Load a category into the form for editing
function editCategory(categoryId) {
    getDocument(CATEGORY_COLLECTION, categoryId)
        .then(function (category) {
            editingCategoryId = category.Id;

            $("#categoryName").val(category.Name);
            $("#saveCategoryBtn").text("Update Category");
            $("#cancelEditBtn").show();

            $("#categoryFormTitle").text("Edit Category");
            $("#categoryName").focus();
        })
        .catch(function (error) {
            showCategoryMessage(getFirestoreError(error), "error");
        });
}

// Delete a category after checking whether products use it
function removeCategory(categoryId) {
    if (!confirm("Are you sure you want to delete this category?")) {
        return;
    }

    queryDocuments("products", "Cat_id", "EQUAL", categoryId)
        .then(function (products) {
            if (products.length > 0) {
                throw new Error(
                    "This category cannot be deleted because products are assigned to it."
                );
            }

            return deleteDocument(CATEGORY_COLLECTION, categoryId);
        })
        .then(function () {
            showCategoryMessage("Category deleted successfully.", "success");
            loadCategories();
        })
        .catch(function (error) {
            showCategoryMessage(getFirestoreError(error), "error");
        });
}

// Reset the category form
function resetCategoryForm() {
    editingCategoryId = null;

    $("#categoryName").val("");
    $("#saveCategoryBtn").text("Add Category");
    $("#cancelEditBtn").hide();
    $("#categoryFormTitle").text("Add New Category");
}

// Display success and error messages
function showCategoryMessage(message, type) {
    $("#categoryMessage")
        .removeClass("success error")
        .addClass(type)
        .text(message)
        .show();
}

// Initialize the page
$(document).ready(function () {
    loadCategories();

    $("#categoryForm").on("submit", function (event) {
        event.preventDefault();
        saveCategory();
    });

    $("#cancelEditBtn").on("click", function () {
        resetCategoryForm();
    });
});
