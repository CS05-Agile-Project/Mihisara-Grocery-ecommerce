import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Slider() {
  const navigate = useNavigate();

  /* ---------- Desktop slides ---------- */
  const desktopSlides = [
    { src: "/images/slider0.png", category: "Cooking Essentials" },
    { src: "/images/slider3.png", category: "Fresh Fruits" },
    { src: "/images/slider4.png", category: "Fresh Vegetables" },
    { src: "/images/slider1.png", category: "Fresh Vegetables" },
    { src: "/images/slider2.png", category: "Fresh Vegetables" },
  ];

  /* ---------- Mobile slides ---------- */
  const mobileSlides = [
    { src: "/images/mob1.png", category: "Mobile Fruits" },
    { src: "/images/mob2.png", category: "Mobile Vegetables" },
    { src: "/images/mob3.png", category: "Snacks" },
  ];

  const [currentDesktop, setCurrentDesktop] = useState(0);
  const [currentMobile, setCurrentMobile] = useState(0);

  // desktop slider autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDesktop((prev) => (prev + 1) % desktopSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [desktopSlides.length]);

  // mobile slider autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMobile((prev) => (prev + 1) % mobileSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [mobileSlides.length]);

  const handleSlideClick = (category) => {
    const slug = encodeURIComponent(category.replace(/\s+/g, "-"));
    navigate(`/category/${slug}`);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl">
      {/* ---------- Desktop view ---------- */}
      <div className="hidden md:block relative h-full w-full">
        {desktopSlides.map((slide, idx) => (
          <img
            key={idx}
            src={slide.src}
            alt={`desktop-slide-${idx}`}
            onClick={() => handleSlideClick(slide.category)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 cursor-pointer ${
              idx === currentDesktop ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Desktop dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {desktopSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentDesktop(idx)}
              className={`h-2 w-2 rounded-full ${
                idx === currentDesktop ? "bg-emerald-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ---------- Mobile view ---------- */}
      <div className="block md:hidden relative h-full w-full">
        {mobileSlides.map((slide, idx) => (
          <img
            key={idx}
            src={slide.src}
            alt={`mobile-slide-${idx}`}
            onClick={() => handleSlideClick(slide.category)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 cursor-pointer ${
              idx === currentMobile ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Mobile dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {mobileSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentMobile(idx)}
              className={`h-2 w-2 rounded-full ${
                idx === currentMobile ? "bg-emerald-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
