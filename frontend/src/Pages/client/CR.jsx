import { Routes, Route, useParams } from "react-router-dom";
import Header from "../../components/header.jsx";
import Footer from "../../components/Footer.jsx";
import Home from "./home.jsx";
import CategoryPage from "./CategoryPage.jsx";
import ProductOverview from "./ProductOverview.jsx";
import ProfilePage from "./profile.jsx";
import SearchPage from "./SearchPage.jsx";
import CartPage from "./cart.jsx";
import CheckoutPage from "./checkout.jsx";
import PaymentPage from "./PaymentPage.jsx";
import ContactUs from "./ContactUs.jsx";
import AboutUs from "./AboutUs.jsx";
import VerifyOrderPage from "./VerifyOrderPage.jsx";
import FaqWidget from "../../components/FaqWidget.jsx";
import InfoPage from "./InfoPage.jsx";
import ErrorPage from "./ErrorPage.jsx";

function CategoryWrapper() {
    const { slug } = useParams();

    let category = decodeURIComponent(slug.replace(/-/g, " "));
    category = category.replace(/\band\b/gi, "&");

    return <CategoryPage title={category} category={category} />;
}

export default function CR() {
    return (
        <div className="flex flex-col min-h-screen font-poppins">
            <Header />

            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/category/:slug" element={<CategoryWrapper />} />
                    <Route path="/hot-deals" element={<CategoryPage category="All" hotDealsOnly />} />
                    <Route path="/product/:id" element={<ProductOverview />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/verify-order/:orderId" element={<VerifyOrderPage />} />
                    <Route path="/terms" element={<InfoPage type="terms" />} />
                    <Route path="/privacy" element={<InfoPage type="privacy" />} />
                    <Route path="/delivery-info" element={<InfoPage type="delivery" />} />
                    <Route path="/returns" element={<InfoPage type="returns" />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="*" element={<ErrorPage />} />
                </Routes>
            </div>

            <Footer />
            <FaqWidget />
        </div>
    );
}
