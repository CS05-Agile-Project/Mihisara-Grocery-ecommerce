/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center bg-white px-6 py-12 h-full relative overflow-hidden">
      {/* Main Illustration - Nest & Egg */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="w-32 h-32"
        >
          {/* Nest Glow Animation */}
          <motion.ellipse
            cx="32"
            cy="48"
            rx="22"
            ry="8"
            fill="#22c55e"
            opacity="0.8"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            filter="url(#glow)"
          />
          <motion.ellipse
            cx="32"
            cy="50"
            rx="18"
            ry="6"
            fill="#facc15"
            opacity="0.7"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
            filter="url(#glow)"
          />

          {/* Egg */}
          <motion.ellipse
            cx="32"
            cy="32"
            rx="12"
            ry="16"
            fill="#fff"
            stroke="#22c55e"
            strokeWidth="2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />

          {/* Question mark above egg */}
          <motion.text
            x="32"
            y="20"
            textAnchor="middle"
            fontSize="16"
            fill="#f97316"
            fontWeight="bold"
            animate={{ y: [20, 16, 20] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ?
          </motion.text>

          {/* Glow filter definition */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Oops! Something went missing
        </h2>
        <p className="mt-2 text-gray-600 max-w-md text-sm">
          We couldn’t find this page, but don’t worry — let’s get you back home.
        </p>
      </motion.div>

      {/* Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="mt-6 px-5 py-2.5 bg-accent text-white rounded-lg font-medium shadow hover:bg-green-700 transition text-sm"
      >
        BACK TO HOMEPAGE
      </motion.button>
    </div>
  );
}
