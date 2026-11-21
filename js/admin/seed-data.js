
const sampleCategories = [
    { Id: "CAT001", Name: "Electronics" },
    { Id: "CAT002", Name: "Mobiles" },
    { Id: "CAT003", Name: "Accessories" },
    { Id: "CAT004", Name: "Home Appliances" },
    { Id: "CAT005", Name: "Computer Accessories" }
];

const sampleProducts = [
    { Id: "PRD001", Cat_id: "CAT001", title: "LED Television", des: "32 inch LED TV", qty: 120, price: 14500, IsActive: true },
    { Id: "PRD002", Cat_id: "CAT001", title: "Bluetooth Speaker", des: "Portable wireless speaker", qty: 80, price: 2500, IsActive: true },
    { Id: "PRD003", Cat_id: "CAT001", title: "Digital Camera", des: "Compact digital camera", qty: 10, price: 22000, IsActive: true },
    { Id: "PRD004", Cat_id: "CAT001", title: "Smart Watch", des: "Fitness tracking smartwatch", qty: 150, price: 3500, IsActive: true },

    { Id: "PRD005", Cat_id: "CAT002", title: "Android Smartphone", des: "128GB smartphone", qty: 45, price: 18000, IsActive: true },
    { Id: "PRD006", Cat_id: "CAT002", title: "Budget Smartphone", des: "Entry-level smartphone", qty: 8, price: 8500, IsActive: true },
    { Id: "PRD007", Cat_id: "CAT002", title: "Premium Smartphone", des: "256GB premium smartphone", qty: 25, price: 42000, IsActive: true },
    { Id: "PRD008", Cat_id: "CAT002", title: "Feature Phone", des: "Basic keypad phone", qty: 110, price: 1800, IsActive: true },

    { Id: "PRD009", Cat_id: "CAT003", title: "USB Cable", des: "Fast charging USB cable", qty: 200, price: 250, IsActive: true },
    { Id: "PRD010", Cat_id: "CAT003", title: "Wireless Mouse", des: "Wireless optical mouse", qty: 75, price: 650, IsActive: true },
    { Id: "PRD011", Cat_id: "CAT003", title: "Keyboard", des: "USB wired keyboard", qty: 12, price: 850, IsActive: true },
    { Id: "PRD012", Cat_id: "CAT003", title: "Headphones", des: "Over-ear headphones", qty: 130, price: 1800, IsActive: true },

    { Id: "PRD013", Cat_id: "CAT004", title: "Electric Kettle", des: "1.5 litre electric kettle", qty: 60, price: 1200, IsActive: true },
    { Id: "PRD014", Cat_id: "CAT004", title: "Mixer Grinder", des: "Three jar mixer grinder", qty: 9, price: 3200, IsActive: true },
    { Id: "PRD015", Cat_id: "CAT004", title: "Air Cooler", des: "Personal air cooler", qty: 105, price: 6500, IsActive: true },
    { Id: "PRD016", Cat_id: "CAT004", title: "Induction Stove", des: "Electric induction cooktop", qty: 30, price: 2800, IsActive: true },

    { Id: "PRD017", Cat_id: "CAT005", title: "Laptop Stand", des: "Adjustable laptop stand", qty: 90, price: 1100, IsActive: true },
    { Id: "PRD018", Cat_id: "CAT005", title: "External Hard Drive", des: "1TB external hard drive", qty: 7, price: 4500, IsActive: true },
    { Id: "PRD019", Cat_id: "CAT005", title: "USB Hub", des: "4 port USB hub", qty: 160, price: 550, IsActive: true },
    { Id: "PRD020", Cat_id: "CAT005", title: "Webcam", des: "Full HD webcam", qty: 40, price: 2100, IsActive: true }
];

async function insertSampleCategories() {
    for (const category of sampleCategories) {
        await createDocument("categories", category.Id, category);
    }

    return "Categories inserted successfully.";
}

async function insertSampleProducts() {
    for (const product of sampleProducts) {
        await createDocument("products", product.Id, product);
    }

    return "Products inserted successfully.";
}

async function insertSampleData() {
    await insertSampleCategories();
    await insertSampleProducts();

    alert("Sample categories and products inserted successfully.");
}


const sampleCustomers = [
    {
        Id: "CUS001",
        Name: "Arun Kumar",
        Email: "arun@example.com",
        Mob: "9876543210",
        CreditLimit: 1000,
        CreditUsed: 300
    },
    {
        Id: "CUS002",
        Name: "Priya Sharma",
        Email: "priya@example.com",
        Mob: "9876543211",
        CreditLimit: 2000,
        CreditUsed: 500
    },
    {
        Id: "CUS003",
        Name: "Rahul Raj",
        Email: "rahul@example.com",
        Mob: "9876543212",
        CreditLimit: 0,
        CreditUsed: 0
    },
    {
        Id: "CUS004",
        Name: "Divya S",
        Email: "divya@example.com",
        Mob: "9876543213",
        CreditLimit: 500,
        CreditUsed: 200
    },
    {
        Id: "CUS005",
        Name: "Karthik M",
        Email: "karthik@example.com",
        Mob: "9876543214",
        CreditLimit: 1500,
        CreditUsed: 0
    },
    {
        Id: "CUS006",
        Name: "Meena R",
        Email: "meena@example.com",
        Mob: "9876543215",
        CreditLimit: 1000,
        CreditUsed: 1000
    },
    {
        Id: "CUS007",
        Name: "Vijay Anand",
        Email: "vijay@example.com",
        Mob: "9876543216",
        CreditLimit: 3000,
        CreditUsed: 750
    },
    {
        Id: "CUS008",
        Name: "Sneha K",
        Email: "sneha@example.com",
        Mob: "9876543217",
        CreditLimit: 0,
        CreditUsed: 0
    },
    {
        Id: "CUS009",
        Name: "Ajith Kumar",
        Email: "ajith@example.com",
        Mob: "9876543218",
        CreditLimit: 2000,
        CreditUsed: 1200
    },
    {
        Id: "CUS010",
        Name: "Nisha P",
        Email: "nisha@example.com",
        Mob: "9876543219",
        CreditLimit: 1000,
        CreditUsed: 400
    }
];

async function insertSampleCustomers() {
    for (const customer of sampleCustomers) {
        await createDocument("customers", customer.Id, customer);
    }

    alert("10 sample customers inserted successfully.");
}


const sampleOrderData = [
    { id: "ORD001", customerId: "CUS001", products: [["PRD001", 1]], payment: "Credit", date: "2026-10-02" },
    { id: "ORD002", customerId: "CUS002", products: [["PRD005", 2]], payment: "Credit", date: "2026-10-05" },
    { id: "ORD003", customerId: "CUS003", products: [["PRD002", 1], ["PRD003", 1]], payment: "Cash", date: "2026-10-08" },
    { id: "ORD004", customerId: "CUS004", products: [["PRD007", 2]], payment: "Credit", date: "2026-10-12" },
    { id: "ORD005", customerId: "CUS005", products: [["PRD009", 1]], payment: "Cash", date: "2026-10-15" },
    { id: "ORD006", customerId: "CUS006", products: [["PRD010", 1]], payment: "Credit", date: "2026-10-18" },
    { id: "ORD007", customerId: "CUS007", products: [["PRD012", 1], ["PRD013", 1]], payment: "Credit", date: "2026-10-21" },
    { id: "ORD008", customerId: "CUS008", products: [["PRD015", 2]], payment: "Cash", date: "2026-10-25" },
    { id: "ORD009", customerId: "CUS009", products: [["PRD017", 1]], payment: "Credit", date: "2026-10-28" },
    { id: "ORD010", customerId: "CUS010", products: [["PRD019", 1], ["PRD020", 2]], payment: "Credit", date: "2026-10-30" }
];

async function insertSampleOrders() {
    try {
        for (const orderData of sampleOrderData) {
            const customer = sampleCustomers.find(
                customer => customer.Id === orderData.customerId
            );

            if (!customer) {
                throw new Error(`Customer ${orderData.customerId} not found.`);
            }

            const items = orderData.products.map(([productId, quantity]) => {
                const product = sampleProducts.find(
                    product => product.Id === productId
                );

                if (!product) {
                    throw new Error(`Product ${productId} not found.`);
                }

                const price = Number(product.price);
                return {
                    ProductId: product.Id,
                    ProductName: product.title,
                    Quantity: quantity,
                    Price: price,
                    Subtotal: price * quantity
                };
            });

            const total = items.reduce(
                (sum, item) => sum + item.Subtotal, 0
            );

            const order = {
                OrderId: orderData.id,
                CustomerId: customer.Id,
                CustomerName: customer.Name,
                CustomerEmail: customer.Email,
                CustomerMobile: customer.Mob,
                OrderDate: new Date(`${orderData.date}T10:00:00`),
                Items: items,
                Total: total,
                PaymentMode: orderData.payment,
                Status: "Confirmed"
            };

            await createDocument("orders", order.OrderId, order);
        }

        alert("10 sample orders inserted successfully.");
    } catch (error) {
        console.error("Sample order insertion error:", error);
        alert(getFirestoreError(error) || error.message);
    }
}
