import toast from "react-hot-toast";


function notifyCartChange() {
    window.dispatchEvent(new Event("cart-changed"));
}


export function getCart() {
    let cart = localStorage.getItem("cart");
    if (cart == null) {
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
    } else {
        cart = JSON.parse(cart);
    }
    return cart;
}


export function removeCart(productId) {
    const newcart = getCart().filter(item => item.productId !== productId);
    localStorage.setItem("cart", JSON.stringify(newcart));
    notifyCartChange();
}


export function addToCart(product, quantity) {
    const token = localStorage.getItem("token");
    if (!token) {
        toast.error("you must login to use cart");
        return;
    }

    const cart = getCart();
    const index = cart.findIndex(item => item.productId === product.productId);

    if (index === -1) {
        cart.push({
            productId: product.productId,
            name: product.name,
            image: product.images[0],
            price: product.price,
            labelledPrice: product.labelledPrice,
            quantity,
            category: product.category,
        });
    } else {
        const newQuantity = cart[index].quantity + quantity;
        if (newQuantity <= 0) {
            removeCart(product.productId);
            return;
        } else {
            cart[index].quantity = newQuantity;
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success("You have successfully added to cart");
    notifyCartChange();
}

export function addToCartQty(product, quantity) {
    const token = localStorage.getItem("token");
    if (!token) {
        toast.error("you must login to use cart");
        return;
    }

    const cart = getCart();
    const index = cart.findIndex(item => item.productId === product.productId);

    if (index === -1) {
        cart.push({
            productId: product.productId,
            name: product.name,
            image: product.images[0],
            price: product.price,
            labelledPrice: product.labelledPrice,
            quantity,
            category: product.category,
        });
    } else {
        const newQuantity = cart[index].quantity + quantity;
        if (newQuantity <= 0) {
            removeCart(product.productId);
            return;
        } else {
            cart[index].quantity = newQuantity;
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    notifyCartChange();
}

export function clearCart() {
    localStorage.setItem("cart", JSON.stringify([]));
    toast.success("Cart cleared");
    notifyCartChange();
}


export function getTotal() {
    return getCart().reduce((total, item) => total + item.price * item.quantity, 0);
}
