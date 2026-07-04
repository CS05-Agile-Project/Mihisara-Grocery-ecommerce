import { ShieldCheck, Leaf, Target, Lightbulb, Eye, Rocket } from "lucide-react";
import { motion } from "framer-motion";

/* ---------- Motion variants ---------- */
const pageVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: "easeOut" },
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

const staggerContainer = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

export default function AboutUs() {
    return (
        <motion.main
            key="about-us"
            className="bg-gray-50 py-16 font-poppins"
            variants={pageVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
        >
            {/* ---------- Section Header ---------- */}
            <motion.div
                className="max-w-4xl mx-auto text-center px-6"
                variants={sectionVariant}
            >
                <p className="uppercase text-xl tracking-wide text-emerald-600 font-semibold">
                    About Us
                </p>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
                    Unveiling Our Identity, Vision and Values
                </h2>
                <p className="mt-4 text-gray-600">
                    At <span className="font-semibold text-emerald-600">Mihisara Grocery</span>, we
                    are passionate about delivering fresh groceries at your doorstep.
                    With years of experience in e-commerce, we’ve become your trusted
                    partner for high-quality products, reliable service, and unbeatable
                    value.
                </p>
            </motion.div>

            {/* ---------- Values Cards ---------- */}
            <motion.div
                className="max-w-5xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 px-6"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {[
                    { icon: ShieldCheck, title: "Quality" },
                    { icon: Leaf, title: "Freshness" },
                    { icon: Target, title: "Precision" },
                    { icon: Lightbulb, title: "Innovation" },
                ].map((item, idx) => (
                    <motion.div
                        key={idx}
                        className="bg-emerald-700 text-white rounded-2xl p-6 shadow-md flex flex-col items-center"
                        variants={cardVariant}
                    >
                        <item.icon className="w-8 h-8 mb-3" />
                        <p className="font-medium">{item.title}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* ---------- Vision & Mission ---------- */}
            <motion.div
                className="max-w-5xl mx-auto mt-14 bg-white shadow rounded-2xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                <motion.div
                    className="text-center md:text-left"
                    variants={sectionVariant}
                >
                    <Eye className="w-8 h-8 text-emerald-600 mb-3 mx-auto md:mx-0" />
                    <h3 className="text-xl font-bold text-emerald-700 mb-2">Vision</h3>
                    <p className="text-gray-600">
                        To lead the way in online grocery shopping by providing convenient,
                        affordable, and fresh solutions that make everyday life easier.
                    </p>
                </motion.div>
                <motion.div
                    className="text-center md:text-left"
                    variants={sectionVariant}
                >
                    <Rocket className="w-8 h-8 text-emerald-600 mb-3 mx-auto md:mx-0" />
                    <h3 className="text-xl font-bold text-emerald-700 mb-2">Mission</h3>
                    <p className="text-gray-600">
                        To leverage technology, logistics, and partnerships to deliver fresh
                        groceries and household essentials with unmatched speed, quality, and trust.
                    </p>
                </motion.div>
            </motion.div>
        </motion.main>
    );
}
