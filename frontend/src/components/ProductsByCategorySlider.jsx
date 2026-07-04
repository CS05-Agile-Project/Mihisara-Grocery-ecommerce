import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Slider from "react-slick";
import ProductCard from "./ProductCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function ProductsByCategorySlider({
  category,
  apiBase = import.meta.env.VITE_BACKEND_URL,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  const sliderRef = useRef(null);
  const location = useLocation();

  // ---------- Fetch ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/products/category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        });
        const data = await res.json();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, apiBase]);

  // ---------- Track viewport ----------
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---------- Page/grid config (NO slick rows) ----------
  const pageCfg = useMemo(() => {
    if (vw >= 1280) return { cols: 4, rows: 2 }; // 8 per page (desktop)
    if (vw >= 1024) return { cols: 3, rows: 2 }; // 6 per page (laptop)
    if (vw >= 768) return { cols: 2, rows: 1 };  // 2 per page (tablet)
    return { cols: 1, rows: 1 };                 // 1 per page (mobile)
  }, [vw]);

  const pageSize = pageCfg.cols * pageCfg.rows;

  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < products.length; i += pageSize) {
      out.push(products.slice(i, i + pageSize));
    }
    return out;
  }, [products, pageSize]);

  // Re-init slick after route/size/data changes
  useEffect(() => {
    // Give layout a tick to paint, then reset to first slide
    const t = setTimeout(() => {
      sliderRef.current?.slickGoTo(0, true);
    }, 50);
    return () => clearTimeout(t);
  }, [location.pathname, pageSize, products.length, category]);

  if (loading) return <p className="text-gray-600">Loading {category}...</p>;
  if (products.length === 0)
    return (
      <p className="text-gray-600">
        No products found in <b>{category}</b>
      </p>
    );

  // Slick shows ONE slide at a time; each slide is a grid "page"
  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    swipeToSlide: true,
    touchMove: true,
    adaptiveHeight: true,
    // no 'rows' here at all ✅
  };

  const hasMultiplePages = pages.length > 1;

  return (
    <div className="relative">
      {/* Left Arrow */}
      {hasMultiplePages && (
        <button
          onClick={() => sliderRef.current?.slickPrev()}
          className="absolute -left-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-accent text-white p-2 hover:bg-emerald-700"
        >
          ‹
        </button>
      )}

      <Slider
        key={`${category}-${pageSize}-${location.pathname}`}
        ref={sliderRef}
        {...settings}
      >
        {pages.map((pageItems, idx) => (
          <div key={idx} className="px-1">
            <div
              className="gap-3 sm:gap-4"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${pageCfg.cols}, minmax(0, 1fr))`,
              }}
            >
              {pageItems.map((p) => (
                <div key={p._id || p.productId} className="p-1 sm:p-2">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Slider>

      {/* Right Arrow */}
      {hasMultiplePages && (
        <button
          onClick={() => sliderRef.current?.slickNext()}
          className="absolute -right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-accent text-white p-2 hover:bg-emerald-700"
        >
          ›
        </button>
      )}
    </div>
  );
}
