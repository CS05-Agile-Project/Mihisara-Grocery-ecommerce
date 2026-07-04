import { useEffect, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react"; // modern icons

export default function FaqWidget() {
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(false);

  // Fetch FAQs from backend
  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL+"/api/faqs")
      .then((res) => res.json())
      .then((data) => setFaqs(data.faqs || []))
      .catch((err) => console.error(err));
  }, []);

  // ✅ Listen for footer "open-faq" event
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-faq", handleOpen);
    return () => window.removeEventListener("open-faq", handleOpen);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 hover:shadow-xl transition"
      >
        <MessageCircleQuestion className="w-6 h-6" />
      </button>

      {/* Sliding FAQ Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl rounded-l-2xl transform transition-transform duration-300 z-50 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-tl-2xl font-poppins ">
          <h2 className="text-lg font-semibold font-poppins">Frequently Asked Questions</h2>
          <button
            onClick={() => setOpen(false)}
            className="hover:rotate-90 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FAQ List */}
        <div className="p-5 overflow-y-auto h-[calc(100%-64px)] font-poppins ">
          {faqs.length === 0 ? (
            <p className="text-gray-500 text-center mt-6">
              No FAQs available yet.
            </p>
          ) : (
            faqs.map((faq) => (
              <details
                key={faq.faqId}
                className="group mb-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <summary className="cursor-pointer px-4 py-3 font-medium text-gray-800 bg-gray-50 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  {faq.question}
                </summary>
                <p className="px-4 py-3 text-gray-600 border-t bg-white">
                  {faq.answer}
                </p>
              </details>
            ))
          )}
        </div>
      </div>
    </>
  );
}
