import { Link } from "react-router-dom";
import { Logo } from "../components/ui.jsx";

const sections = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an account or using PalayUP, you agree to these Terms and Conditions. If you do not agree, do not use the platform.",
  },
  {
    title: "2. About PalayUP",
    body: "PalayUP is a farm-to-buyer marketplace that connects farmers, buyers, and administrators. The platform publishes guide prices, lists produce, tracks orders, and enables messaging. PalayUP does not process payments, hold funds, or guarantee transactions between users.",
  },
  {
    title: "3. Eligibility and accounts",
    body: "You must provide accurate registration information and keep your login credentials secure. You are responsible for activity under your account. Farmers must truthfully describe their farm, location, and contact details. Buyers must provide valid contact information for order coordination.",
  },
  {
    title: "4. Guide prices and listings",
    body: "Guide prices are weekly market averages published by PalayUP administrators. Farmers must set listing prices within each product’s prescribed min–max range. Guide prices are for reference and comparison only; final price and payment terms are agreed directly between farmer and buyer.",
  },
  {
    title: "5. Orders and fulfillment",
    body: "When a buyer places an order, it enters a tracked queue (queued, confirmed, preparing, ready, completed). Farmers and buyers arrange pickup or delivery and payment outside the app using the contact details shown on each order. PalayUP is not a party to those arrangements and is not responsible for quality, quantity, timing, or payment disputes.",
  },
  {
    title: "6. Off-platform payments",
    body: "All payments occur off-platform. PalayUP does not collect payment, issue receipts, or provide escrow. Users assume all risk related to cash, bank transfer, or other payment methods used between themselves.",
  },
  {
    title: "7. Messaging and conduct",
    body: "Use in-app chat and notifications respectfully and only for legitimate marketplace purposes. Do not harass other users, post false information, attempt fraud, or misuse the platform. PalayUP may suspend or remove accounts that violate these rules.",
  },
  {
    title: "8. AI assistant",
    body: "Role-based AI assistants provide general guidance about products, orders, pricing, and platform features. AI responses are informational only and do not constitute legal, financial, or agricultural advice.",
  },
  {
    title: "9. Privacy",
    body: "Account information, farm or delivery details, order history, and messages are stored to operate the service. Contact information you share may be visible to other users involved in an order. Do not share sensitive financial credentials through the platform.",
  },
  {
    title: "10. Availability and changes",
    body: "PalayUP may update features, guide prices, or these terms at any time. Continued use after changes constitutes acceptance. We may modify, suspend, or discontinue the service with reasonable notice where practicable.",
  },
  {
    title: "11. Limitation of liability",
    body: "PalayUP is provided “as is.” To the fullest extent permitted by law, PalayUP and its operators are not liable for indirect, incidental, or consequential damages arising from use of the platform or off-platform transactions between users.",
  },
  {
    title: "12. Contact",
    body: "Questions about these terms: hello@palayapp.com or +63 917 555 0100.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-forest-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-forest-950">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-forest-600">Last updated: August 15, 2026</p>

        <div className="mt-8 space-y-6 rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm leading-relaxed text-forest-800">
            These Terms and Conditions govern your use of PalayUP, including the admin console, farmer app, and buyer app.
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
          <Link to="/privacy" className="font-semibold text-forest-900 underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link to="/refund" className="font-semibold text-forest-900 underline">
            Refund Policy
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
