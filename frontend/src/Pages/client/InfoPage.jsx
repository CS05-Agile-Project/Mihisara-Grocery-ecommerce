import { Link } from "react-router-dom";

const pages = {
  terms: {
    title: "Terms & Conditions",
    body: [
      "By using Mihisara Grocery, customers agree to provide accurate account, delivery, and payment details.",
      "Orders are confirmed based on product availability, successful checkout, and store acceptance.",
      "Prices, offers, and delivery availability may change based on stock and store operations.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "Customer details are used to manage accounts, process orders, arrange delivery, and provide support.",
      "Login and order data should be handled securely and not shared outside required store operations.",
      "Customers can contact Mihisara Grocery for account or order-related privacy questions.",
    ],
  },
  delivery: {
    title: "Delivery Information",
    body: [
      "Delivery orders are assigned to available riders after checkout and order confirmation.",
      "Customers can view order progress from their profile when logged in.",
      "Store pickup orders may include verification through the order QR process.",
    ],
  },
  returns: {
    title: "Returns & Refunds",
    body: [
      "Customers should contact the store quickly if an item is damaged, missing, or incorrect.",
      "Return or refund handling depends on product condition, order status, and store review.",
      "Fresh grocery items may have limited return eligibility for safety and quality reasons.",
    ],
  },
};

export default function InfoPage({ type }) {
  const page = pages[type] || pages.terms;

  return (
    <main className="container mx-auto px-6 py-10 font-poppins">
      <div className="max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-emerald-600 hover:underline">
          Back to Home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">{page.title}</h1>
        <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
          {page.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
