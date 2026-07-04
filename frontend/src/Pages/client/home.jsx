import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductsByCategorySlider from "../../components/ProductsByCategorySlider";
import Footer from "../../components/Footer";
import Slider from "../../components/Slider";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    Apple, Carrot, Beef, ChefHat, Cookie, Milk, CupSoda,
    BrushCleaning, HeartPlus, PillBottle, Grape, Soup,
} from "lucide-react";

//motion framer
const pageVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: "easeOut" },
    },
};

const staggerContainer = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const sectionVariant = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const cardVariant = {
    hidden: { opacity: 0, scale: 0.98, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25 } },
};

export default function HomePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showAll, setShowAll] = useState(false); // ✅ just toggles more rows
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (location.state?.scrollTo === "top-saver") {
            const target = document.getElementById("top-saver");
            if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 100);
        }
    }, [location.state]);

    const categories = [
        { name: "Fresh Fruits", icon: Apple },
        { name: "Fresh Vegetables", icon: Carrot },
        { name: "Meat & Fish", icon: Beef },
        { name: "Cooking Essentials", icon: ChefHat },
        { name: "Bakery & Biscuits", icon: Cookie },
        { name: "Milk & Dairy", icon: Milk },
        { name: "Beverages", icon: CupSoda },
        { name: "Household Needs", icon: BrushCleaning },
        { name: "Personal Care", icon: HeartPlus },
        { name: "Health & Wellness", icon: PillBottle },
        { name: "Snacks & Munchies", icon: Grape },
        { name: "Spices & Masalas", icon: Soup },
        // add more if needed
    ];

    const goToCategory = (cName) => {
        const slug = encodeURIComponent(cName.replace(/\s+/g, "-"));
        navigate(`/category/${slug}`);
    };

    const goToPersonalCare = () => navigate("/category/Personal-Care");

    return (
        <AnimatePresence mode="wait">
            <motion.main
                key="home-page"
                className="bg-gray-50 font-poppins"
                variants={pageVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                style={{ willChange: "transform, opacity" }}
            >
                {/* HERO */}
                <motion.section
                    className="container mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12"
                    variants={sectionVariant}
                >
                    <div className="relative rounded-3xl overflow-hidden h-120">
                        <Slider />
                    </div>
                </motion.section>

                {/* TOP SAVER TODAY */}
                <motion.section
                    id="top-saver"
                    className="container mx-auto px-4 md:px-8 lg:px-12"
                    variants={sectionVariant}
                >
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pb-9">
                        Top Saver Today
                    </h2>
                    <ProductsByCategorySlider category="Offers" apiBase={import.meta.env.VITE_BACKEND_URL} />
                </motion.section>

                {/* WIDE PROMO BANNER */}
                <motion.section
                    onClick={goToPersonalCare}
                    className="container mx-auto px-4 md:px-8 lg:px-12 mt-10 cursor-pointer"
                    variants={sectionVariant}
                >
                    <motion.div
                        className="relative rounded-3xl overflow-hidden bg-[#c5d7de] hover:shadow-lg transition"
                        whileHover={!prefersReducedMotion ? { scale: 1.01 } : undefined}
                    >
                        <div className="relative grid md:grid-cols-2 items-stretch">
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                <span className="inline-block rounded-full bg-emerald-100 text-accent text-xs font-semibold px-3 py-1">
                  ALL BEAUTY PRODUCTS
                </span>
                                <h3 className="mt-3 text-2xl md:text-3xl font-bold text-blue-950/90">
                                    Beauty &amp; Personal Care
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    Up to <span className="text-dgreen font-semibold">70% Off</span>
                                </p>
                                <button className="mt-5 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-emerald-700 transition">
                                    Shop Now
                                </button>
                            </div>
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundImage: "url('/images/beauty.jpg')",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            />
                        </div>
                    </motion.div>
                </motion.section>

                {/* FEATURE BADGES */}
                <motion.section
                    className="container mx-auto px-4 md:px-8 lg:px-12 mt-10"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { title: "Fastest Delivery", desc: "Get in 2 hours" },
                            { title: "Best Service", desc: "24/7 support" },
                            { title: "Verified Brands", desc: "100% genuine" },
                            { title: "100% Assurance", desc: "Quality checked" },
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                variants={cardVariant}
                                className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-gray-200"
                            >
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{f.title}</p>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* THREE PROMO TILES */}
                <motion.section
                    className="container mx-auto px-4 md:px-8 lg:px-12 mt-10"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <div className="grid md:grid-cols-3 gap-6">
                        <PromoTile title="Fresh Fruits" subtitle="up to 20% off" bgImg="/images/fruits.jpg" category="Fresh Fruits" />
                        <PromoTile title="Healthy Vegetables" subtitle="save 15%" bgImg="/images/vegetables.jpg" category="Fresh Vegetables" />
                        <PromoTile title="Crunchy Snacks" subtitle="combo offers" bgImg="/images/snacks.jpg" category="Snacks" />
                    </div>
                </motion.section>

                {/* BROWSE BY CATEGORY - inline expandable */}
                <motion.section
                    className="container mx-auto px-4 md:px-8 lg:px-12 mt-12 mb-4"
                    variants={sectionVariant}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                            Browse by Category
                        </h2>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-accent text-sm font-semibold hover:text-emerald-800"
                        >
                            {showAll ? "Show Less" : "View All"}
                        </button>
                    </div>

                    <motion.div
                        className="mt-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        {(showAll ? categories : categories.slice(0, 6)).map((c, idx) => {
                            const Icon = c.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    variants={cardVariant}
                                    onClick={() => goToCategory(c.name)}
                                    className="group rounded-2xl border border-gray-200 bg-white p-4 flex flex-col items-center justify-center hover:border-accent transition cursor-pointer"
                                    whileHover={!prefersReducedMotion ? { y: -2 } : undefined}
                                >
                                    <div className="h-14 w-14 rounded-xl bg-gray-100 group-hover:bg-emerald-50 flex items-center justify-center">
                                        <Icon className="h-8 w-8 text-gray-500 group-hover:text-accent/80" />
                                    </div>

                                    <p className="mt-3 text-sm font-semibold text-gray-800 text-center">
                                        {c.name}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </motion.section>
            </motion.main>
        </AnimatePresence>
    );
}

/** PromoTile navigates to category page (with subtle hover + reveal) */
function PromoTile({ title, subtitle, bgImg, category }) {
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();
    const handleClick = () => {
        const slug = encodeURIComponent(category.replace(/\s+/g, "-"));
        navigate(`/category/${slug}`);
    };

    return (
        <motion.div
            onClick={handleClick}
            className="relative overflow-hidden rounded-3xl border border-gray-200 h-48 md:h-56 flex items-center cursor-pointer hover:shadow-lg transition"
            style={{
                backgroundImage: `url(${bgImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
            variants={cardVariant}
            whileHover={!prefersReducedMotion ? { scale: 1.01 } : undefined}
        >
            <motion.div
                className="p-6 bg-black/20 w-full h-full flex flex-col justify-center rounded-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.35 } }}
            >
                <p className="text-2xl font-bold text-white">{title}</p>
                <p className="text-md text-gray-100">{subtitle}</p>
                <button className="mt-4 w-fit rounded-xl bg-accent text-white px-4 py-2 text-sm font-semibold hover:bg-accent/80 transition">
                    Shop Now
                </button>
            </motion.div>
        </motion.div>
    );
}
