import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle, backLink }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-800 font-poppins">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-lg border border-gray-200">

                {/* Left image panel */}
                <div className="hidden md:block relative">
                    <img
                        src="/authimage.jpeg"  // replace with your static image
                        alt="Side Illustration"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                        <Link
                            to={backLink || "/"}
                            className="bg-white/80 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-white transition"
                        >
                            ← Back to website
                        </Link>
                    </div>
                </div>

                {/* Right form */}
                <div className="bg-white p-10 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold mb-2">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
