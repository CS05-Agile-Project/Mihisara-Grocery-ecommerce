// pages/search/SearchPage.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ProductCardCat from "../../components/ProductCardCat.jsx";

export default function SearchPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/search?query=${query}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [query]);

  return (
    <main className="container mx-auto px-4 py-8 font-poppins">
      <h2 className="text-xl font-semibold mb-6">
        Search results for: <span className="text-accent">"{query}"</span>
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((p) => (
            <ProductCardCat key={p._id || p.productId} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No products found.</p>
      )}
    </main>
  );
}
