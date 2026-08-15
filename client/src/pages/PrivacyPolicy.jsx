import { Link } from "react-router-dom";
import { Logo } from "../components/ui.jsx";

const sections = [
  {
    title: "1. Introduction",
    body: "PalayUP (“we,” “us,” or “our”) respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your choices when you use the PalayUP admin console, farmer app, and buyer app.",
  },
  {
    title: "2. Information we collect",
    body: "We collect information you provide when registering and using the platform, including your name, email, phone number, password (stored in hashed form), role (admin, farmer, or buyer), farm name (for farmers), and address details (street, city, province). We also store order history, product listings, in-app messages, notifications, and AI assistant conversations related to your account.",
  },
  {
    title: "3. How we use your information",
    body: "We use your information to create and manage accounts, display listings and orders, connect farmers and buyers, send order and chat notifications, publish guide prices, operate role-based AI assistants, and maintain platform security. We do not use PalayUP to process payments or store payment card or bank account details.",
  },
  {
    title: "4. Information shared with other users",
    body: "When you place or receive an order, relevant contact and location details are shared between the buyer and farmer involved so pickup, delivery, and off-platform payment can be arranged. Farm names, phone numbers, and addresses may appear on product listings and order screens. Messages you send in chat are visible to participants in that conversation.",
  },
  {
    title: "5. Information shared with administrators",
    body: "PalayUP administrators can access user accounts, listings, orders, chats, and platform settings to operate the marketplace, enforce policies, and publish guide prices. Admin access is limited to legitimate platform management purposes.",
  },
  {
    title: "6. Cookies and local storage",
    body: "PalayUP stores a login token to keep you signed in. If you choose Remember me on the sign-in screen, the token is kept in your browser’s local storage so you stay signed in after you close the browser (up to 30 days, and it renews while you use the app). Without Remember me, the token is kept only for the browser session (up to 12 hours of activity). We do not use third-party advertising cookies. Session data is used only to authenticate API requests to our servers.",
  },
  {
    title: "7. Data retention",
    body: "We retain account and transaction-related data for as long as your account is active and as needed to operate the service, resolve disputes, and comply with legal obligations. You may request account deletion by contacting support; some records may be retained where required by law.",
  },
  {
    title: "8. Security",
    body: "We use reasonable technical and organizational measures to protect your data, including password hashing and authenticated API access. No method of transmission or storage is completely secure; you are responsible for keeping your login credentials confidential.",
  },
  {
    title: "9. Your choices and rights",
    body: "You may update profile information within the app where available. You can sign out at any time to remove the local login token. You may contact us to request access to, correction of, or deletion of personal data subject to applicable law.",
  },
  {
    title: "10. Children",
    body: "PalayUP is not intended for users under 18 years of age. We do not knowingly collect personal information from children.",
  },
  {
    title: "11. Changes to this policy",
    body: "We may update this Privacy Policy from time to time. The “Last updated” date at the top will reflect changes. Continued use of PalayUP after updates constitutes acceptance of the revised policy.",
  },
  {
    title: "12. Contact us",
    body: "Privacy questions or requests: hello@palayapp.com or +63 917 555 0100.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-forest-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-forest-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-forest-600">Last updated: August 15, 2026</p>

        <div className="mt-8 space-y-6 rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm leading-relaxed text-forest-800">
            This Privacy Policy describes how PalayUP handles personal information for farmers, buyers, and administrators.
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
