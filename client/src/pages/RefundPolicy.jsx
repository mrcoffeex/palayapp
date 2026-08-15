import { Link } from "react-router-dom";
import { Logo } from "../components/ui.jsx";

const sections = [
  {
    title: "1. Overview",
    body: "PalayUP is a marketplace that connects farmers and buyers. We track orders and guide prices, but we do not process payments, hold funds, or issue refunds on behalf of users. This Refund Policy explains how refund requests are handled on and off the platform.",
  },
  {
    title: "2. No in-app payments",
    body: "All payments are arranged directly between the buyer and farmer outside PalayUP — for example via cash, bank transfer, or other methods you agree on. Because PalayUP never receives your payment, we cannot refund money paid to a farmer or buyer through the app.",
  },
  {
    title: "3. Refunds between users",
    body: "If you are unhappy with an order — for example due to quality, quantity, spoilage, or non-delivery — you must contact the other party directly using the phone number, farm details, or in-app chat shown on the order. Refund amounts, replacements, and timing are negotiated between the buyer and farmer.",
  },
  {
    title: "4. Order status and cancellations",
    body: "Orders move through statuses: queued, confirmed, preparing, ready, and completed. Buyers may request cancellation before an order is confirmed or while it is still being prepared by messaging the farmer. Farmers may decline or accept cancellations according to their own policies. Updating an order status in PalayUP does not by itself trigger a financial refund.",
  },
  {
    title: "5. Farmer responsibilities",
    body: "Farmers should describe products accurately, honor agreed prices within guide-price ranges, and communicate clearly about pickup or delivery. If a farmer accepts payment but cannot fulfill an order, the farmer is responsible for returning or refunding payment through the same off-platform method used by the buyer.",
  },
  {
    title: "6. Buyer responsibilities",
    body: "Buyers should inspect orders at pickup or delivery when possible, confirm quantities, and raise concerns promptly with the farmer. Payment should only be sent using contact details verified on the PalayUP order or product screen.",
  },
  {
    title: "7. Disputes PalayUP cannot resolve",
    body: "PalayUP is not a party to off-platform payment agreements. We cannot reverse bank transfers, recover cash payments, or force a user to issue a refund. We may review reports of misuse and suspend accounts that violate our Terms and Conditions, but that does not replace a refund from the other user.",
  },
  {
    title: "8. Reporting a problem",
    body: "If you believe another user is acting in bad faith or violating platform rules, contact us at hello@palayapp.com with your order details. We may investigate and take account action, but financial remedies remain between buyer and farmer unless required by applicable law.",
  },
  {
    title: "9. Guide prices and listing errors",
    body: "Guide prices are weekly market averages for reference. If a listing price falls outside the prescribed range, administrators may adjust or remove the listing. This does not automatically entitle a buyer to a refund for a completed off-platform transaction.",
  },
  {
    title: "10. Changes to this policy",
    body: "We may update this Refund Policy at any time. The “Last updated” date at the top will reflect changes. Continued use of PalayUP after updates constitutes acceptance of the revised policy.",
  },
  {
    title: "11. Contact us",
    body: "Questions about this Refund Policy: hello@palayapp.com or +63 917 555 0100.",
  },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-forest-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-forest-950">Refund Policy</h1>
        <p className="mt-2 text-sm text-forest-600">Last updated: August 15, 2026</p>

        <div className="mt-8 space-y-6 rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm leading-relaxed text-forest-800">
            Because PalayUP does not collect payment, refunds are handled directly between buyers and farmers. Read this policy before placing or fulfilling an order.
          </p>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-lg text-forest-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-forest-700">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm text-forest-700">
          <Link to="/docs" className="font-semibold text-forest-900 underline">
            Documentation
          </Link>
          {" · "}
          <Link to="/terms" className="font-semibold text-forest-900 underline">
            Terms and Conditions
          </Link>
          {" · "}
          <Link to="/privacy" className="font-semibold text-forest-900 underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link to="/login" className="font-semibold text-forest-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
