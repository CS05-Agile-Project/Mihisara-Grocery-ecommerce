import { Navigate, Routes, Route, useParams } from "react-router-dom";
import Header from "../../components/header.jsx";
import Footer from "../../components/Footer.jsx";
import Home from "./home.jsx";
import CategoryPage from "./CategoryPage.jsx";
import ProductOverview from "./ProductOverview.jsx";
import ProfilePage from "./profile.jsx";
import SearchPage from "./SearchPage.jsx"; // ✅ new import

function CategoryWrapper() {
    const { slug } = useParams();

    // Convert slug back to category name
    let category = decodeURIComponent(slug.replace(/-/g, " "));
    category = category.replace(/\band\b/gi, "&");

    return <CategoryPage title={category} category={category} />;
}

export default function CR() {
    return (
        <div className="flex flex-col min-h-screen font-poppins">
            {/* Header always at top */}
            <Header />

            {/* Page content fills remaining space */}
            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/category/:slug" element={<CategoryWrapper />} />
                    <Route path="/product/:id" element={<ProductOverview />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    {/* SPRINT 1 DEMO: cart, checkout, contact/reviews and about routes are temporarily disabled. */}
                    {/* Search route */}
                    <Route path="/search" element={<SearchPage />} />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>

            {/* Footer always at bottom */}
            <Footer />
            {/* ✅ Floating FAQ Widget */}
            {/* SPRINT 1 DEMO: FAQ widget is temporarily disabled. */}
        </div>
    );
}
