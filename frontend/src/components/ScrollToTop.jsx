// ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * This component listens for every route/pathname change
 * and automatically scrolls the window to the top.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to very top whenever the route changes
    window.scrollTo({ top: 0, behavior: "instant" }); // or "smooth" if you like
  }, [pathname]);

  return null; // It doesn’t render anything visible
}
