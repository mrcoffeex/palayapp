import { Link } from "react-router-dom";
import { Logo } from "../components/ui.jsx";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "buyers", label: "For buyers" },
  { id: "farmers", label: "For farmers" },
  { id: "admins", label: "For admins" },
  { id: "pricing", label: "Guide prices" },
  { id: "orders", label: "Order flow" },
  { id: "chat", label: "Chat and contact" },
  { id: "assistant", label: "AI assistant" },
  { id: "payments", label: "Payments and refunds" },
  { id: "demo", label: "Demo accounts" },
];

const statuses = [
  { name: "Queued", detail: "Buyer request is in the farmer’s live queue." },
  { name: "Confirmed", detail: "Farmer accepted the order and will prepare it." },
  { name: "Preparing", detail: "Produce is being packed or harvested to fill." },
  { name: "Ready", detail: "Order is ready for pickup or delivery." },
  { name: "Completed", detail: "Handoff is done. Payment stays off-app." },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="font-display text-xl text-forest-950">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-forest-700">{children}</div>
    </section>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-900 text-[11px] font-bold text-white">
        {n}
      </span>
      <div>
        <p className="font-semibold text-forest-950">{title}</p>
        <p className="mt-0.5">{children}</p>
      </div>
    </li>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen bg-forest-50 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-forest-950">Documentation</h1>
        <p className="mt-2 text-sm text-forest-600">How to use PalayUP as a buyer, farmer, or administrator.</p>

        <nav className="mt-8 rounded-3xl bg-forest-900 p-5 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-300">On this page</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-forest-50 hover:bg-white/20"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-6 space-y-8 rounded-3xl bg-white p-6 shadow-card">
          <Section id="overview" title="Overview">
            <p>
              PalayUP is a farm-to-buyer marketplace. Administrators publish weekly market guide prices. Farmers list
              produce inside those ranges. Buyers browse, compare, and place orders. There is no in-app payment —
              farmers and buyers arrange pickup or delivery and pay each other directly.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { role: "Buyer", use: "Browse listings, compare to the guide, order, and contact the farm." },
                { role: "Farmer", use: "Publish harvests, manage a live queue, and share farm contact details." },
                { role: "Admin", use: "Verify users, set guide prices, inspect orders, and configure the platform." },
              ].map((card) => (
                <div key={card.role} className="rounded-2xl bg-forest-50 p-4">
                  <p className="font-display text-lg text-forest-950">{card.role}</p>
                  <p className="mt-1 text-xs text-forest-700">{card.use}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="accounts" title="Create an account">
            <ol className="space-y-3">
              <Step n="1" title="Open Create an account">
                From the sign-in screen, choose Create an account. Registration is for farmers and buyers only.
              </Step>
              <Step n="2" title="Choose your role">
                Select Buyer or Farmer / merchant. Farmers also enter a farm name — buyers see this on listings and
                orders.
              </Step>
              <Step n="3" title="Add contact and address">
                Phone and location are required so the other party can arrange pickup or delivery after an order.
              </Step>
              <Step n="4" title="Accept the policies">
                Agree to the Terms, Privacy Policy, and Refund Policy, then create the account. You land in the app for
                your role.
              </Step>
            </ol>
            <p>
              Keep your login private. Check Remember me on sign-in to stay signed in after you close the browser.
              Saving profile, listings, orders, or settings does not sign you out. You can update name, phone, and
              address later from Profile (farmer) or You (buyer). Admins sign in with a console account — they are not
              created through public registration.
            </p>
          </Section>

          <Section id="buyers" title="For buyers">
            <p>The buyer app is a phone-style market. Use the bottom tabs: Market, Orders, Chat, and You.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-forest-900">Browse.</strong> Search by crop name or filter by category (Grains,
                Vegetables, Fruits, Root crops, Herbs). Listings tagged below the market guide appear first.
              </li>
              <li>
                <strong className="text-forest-900">Compare.</strong> Open a product to see the farmer’s price next to
                the admin average and min–max range.
              </li>
              <li>
                <strong className="text-forest-900">Order.</strong> Set quantity, add a note (pickup time, ripeness),
                and tap Place order · no payment. You enter the farmer’s queue and see farm phone and address.
              </li>
              <li>
                <strong className="text-forest-900">Track.</strong> Orders shows queue position, item list, status
                timeline, and farmer contact. Message the farmer from the product page or Chat.
              </li>
            </ul>
          </Section>

          <Section id="farmers" title="For farmers">
            <p>The farmer app uses Home, Products, Orders, Chat, and Profile.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-forest-900">Home.</strong> See open queue count, completed value, and the latest
                orders.
              </li>
              <li>
                <strong className="text-forest-900">List produce.</strong> On Products, tap Add listing. Pick a product
                from the pricing guide, stay inside the min–max range, add stock, harvest date, optional photo (JPG,
                PNG, WEBP, or GIF, up to 5MB), and organic if it applies. Hide a listing when stock is gone.
              </li>
              <li>
                <strong className="text-forest-900">Work the queue.</strong> Orders has Queue and History. Reorder with
                the up/down controls, advance status (queued → confirmed → preparing → ready → completed), or cancel
                from Details.
              </li>
              <li>
                <strong className="text-forest-900">Profile.</strong> Keep farm name, phone, and address accurate —
                buyers see these on every order.
              </li>
            </ul>
          </Section>

          <Section id="admins" title="For administrators">
            <p>The admin console is a desktop dashboard. Use the sidebar to manage the marketplace.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-forest-900">Overview.</strong> Charts and stats for users, listings, orders, and
                price alignment.
              </li>
              <li>
                <strong className="text-forest-900">Users.</strong> Create or edit accounts with a role (admin, farmer,
                or buyer), search and sort the directory, verify farms, or suspend an account.
              </li>
              <li>
                <strong className="text-forest-900">Products.</strong> Review listings against the guide and hide or
                restore them.
              </li>
              <li>
                <strong className="text-forest-900">Guide prices.</strong> Sync from DA Bantay Presyo (automatic every 6
                hours, or Sync now). Farmers cannot list outside the published min–max.
              </li>
              <li>
                <strong className="text-forest-900">Orders and Chat.</strong> Inspect status history, override status if
                needed, and review conversations (read-only).
              </li>
              <li>
                <strong className="text-forest-900">Settings.</strong> App name, support contacts, registration toggle,
                and marketplace notes. Reset platform data restores the demo seed and signs you out.
              </li>
            </ul>
          </Section>

          <Section id="pricing" title="Guide prices">
            <p>
              Guide prices come from{" "}
              <a href="http://www.bantaypresyo.da.gov.ph/" className="font-semibold text-forest-900 underline">
                DA Bantay Presyo
              </a>
              . PalayUP syncs rice, corn, vegetables, fruits, and spices automatically every 6 hours (and whenever an
              admin taps Sync now). Each product has an average plus a min–max range from monitored wet markets.
              Farmers must price listings inside that range. Buyers use the same numbers to see whether a listing is
              below, at, or above the average.
            </p>
            <p>
              Guide prices are a reference, not a checkout total. Final payment terms are agreed between farmer and
              buyer outside PalayUP.
            </p>
          </Section>

          <Section id="orders" title="Order flow">
            <p>Every order moves through the same statuses. Farmers advance one step at a time. Admins can override.</p>
            <ol className="space-y-2">
              {statuses.map((s, i) => (
                <li key={s.name} className="flex gap-3 rounded-2xl bg-forest-50 px-4 py-3">
                  <span className="font-display text-lg text-forest-900">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-forest-950">{s.name}</p>
                    <p className="text-xs text-forest-600">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p>
              Updating status does not move money. If you need to cancel, message the other party first. Farmers can
              cancel from order details; buyers should request cancellation in chat before the order is ready.
            </p>
          </Section>

          <Section id="chat" title="Chat and contact">
            <p>
              In-app chat is for coordinating pickup, delivery, quantity, and quality. Buyers can start a thread from a
              product page. Farmers see buyer threads under Chat. Phone number and farm address also appear on the
              order so you can call or visit.
            </p>
            <p>Do not send bank passwords, card numbers, or other credentials in chat.</p>
          </Section>

          <Section id="assistant" title="AI assistant">
            <p>
              Each role has a floating Assistant button. It answers from live app data for that role — listings, guide
              prices, queue status, or platform stats. Replies are informational only and are not legal, financial, or
              agricultural advice.
            </p>
          </Section>

          <Section id="payments" title="Payments and refunds">
            <p>
              PalayUP never collects payment, holds funds, or issues refunds. Pay the farmer using a method you both
              agree on after you confirm the order details. If something is wrong with quality, quantity, or delivery,
              settle it directly with the other user. See the{" "}
              <Link to="/refund" className="font-semibold text-forest-900 underline">
                Refund Policy
              </Link>{" "}
              for what the platform can and cannot do.
            </p>
          </Section>

          <Section id="demo" title="Try the demo">
            <p>Local installs include sample accounts. Tap a demo card on the sign-in screen or use:</p>
            <div className="overflow-hidden rounded-2xl border border-forest-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-50 text-xs uppercase text-forest-600">
                  <tr>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Password</th>
                  </tr>
                </thead>
                <tbody className="text-forest-800">
                  <tr className="border-t border-forest-50">
                    <td className="px-4 py-2.5">Admin</td>
                    <td className="px-4 py-2.5">admin@palayapp.com</td>
                    <td className="px-4 py-2.5">Admin@123</td>
                  </tr>
                  <tr className="border-t border-forest-50">
                    <td className="px-4 py-2.5">Farmer</td>
                    <td className="px-4 py-2.5">rosa@palayapp.com</td>
                    <td className="px-4 py-2.5">Farmer@123</td>
                  </tr>
                  <tr className="border-t border-forest-50">
                    <td className="px-4 py-2.5">Buyer</td>
                    <td className="px-4 py-2.5">ana@palayapp.com</td>
                    <td className="px-4 py-2.5">Buyer@123</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Other farmers: juan@, maria@, pedro@ (same farmer password). Other buyers: carlo@, lisa@ (same buyer
              password).
            </p>
          </Section>
        </div>

        <p className="mt-8 text-sm text-forest-700">
          <Link to="/terms" className="font-semibold text-forest-900 underline">
            Terms and Conditions
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
