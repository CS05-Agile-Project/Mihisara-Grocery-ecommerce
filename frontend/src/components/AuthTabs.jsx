import { Link, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi"; // feather icon for arrow

export default function AuthTabs() {
    const location = useLocation();
    const isLogin = location.pathname === "/login";

    return (
        <div className="flex items-center gap-6 text-sm font-semibold border-b border-gray-200 mb-6 font-poppins">
            {/* Back arrow */}
            <Link
                to="/"
                className="flex items-center mb-2 text-gray-500 hover:text-accent"
            >
                <FiArrowLeft className="text-lg" />
            </Link>

            {/* Tabs */}
            <div className="flex items-center gap-8">
                <Link
                    to="/login"
                    className={`pb-2 ${
                        isLogin
                            ? "text-accent border-b-2 border-accent"
                            : "text-gray-500 hover:text-accent"
                    }`}
                >
                    LOG IN
                </Link>
                <Link
                    to="/signup"
                    className={`pb-2 ${
                        !isLogin
                            ? "text-accent border-b-2 border-accent"
                            : "text-gray-500 hover:text-accent"
                    }`}
                >
                    REGISTER
                </Link>
            </div>
        </div>
    );
}
