function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function peso(n) {
  return `₱${Number(n).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function formatLoc(loc) {
  if (!loc) return "location not set";
  return `${loc.address}, ${loc.city}, ${loc.province}`;
}

export function answerAssistant({ role, user, message, db }) {
  const q = String(message || "").trim();
  const text = q.toLowerCase();
  const farmers = db.users.filter((u) => u.role === "farmer");
  const buyers = db.users.filter((u) => u.role === "buyer");
  const activeProducts = db.products.filter((p) => p.status === "active");

  if (!q) {
    return {
      reply: "Ask me anything about products, orders, pricing, or how PalayApp works.",
      suggestions: suggestionsFor(role),
    };
  }

  if (includesAny(text, ["hello", "hi ", "hey", "good morning", "good afternoon", "help"])) {
    return {
      reply: greeting(role, user),
      suggestions: suggestionsFor(role),
    };
  }

  if (includesAny(text, ["guide price", "average price", "prescribed", "market price", "fair price"])) {
    const lines = db.guidePrices
      .slice(0, 8)
      .map((g) => `• ${g.name}: ${peso(g.averagePrice)}/${g.unit} (range ${peso(g.minPrice)}–${peso(g.maxPrice)})`);
    return {
      reply:
        `${db.settings.guidePriceNote}\n\nCurrent guide prices:\n${lines.join("\n")}`,
      suggestions: suggestionsFor(role),
    };
  }

  if (includesAny(text, ["payment", "pay", "gcash", "card", "checkout"])) {
    return {
      reply: db.settings.noPaymentNote,
      suggestions: ["How do I contact a farmer?", "Where is the farm?", "Track my order"],
    };
  }

  if (role === "admin") return adminAnswer(text, user, db, farmers, buyers, activeProducts);
  if (role === "farmer") return farmerAnswer(text, user, db, activeProducts);
  return buyerAnswer(text, user, db, activeProducts);
}

function greeting(role, user) {
  const first = user.name.split(" ")[0];
  if (role === "admin") {
    return `Hello ${first}. I’m the PalayApp admin assistant. I can summarize users, products, orders, chats, notifications, and guide prices.`;
  }
  if (role === "farmer") {
    return `Hello ${first}. I can help you list produce within the market guide range, queue incoming orders, update status, and message buyers.`;
  }
  return `Hello ${first}. I can help you find fair-priced produce, compare listings to the market guide, place orders, and reach farmers. There is no in-app payment — you’ll get the farmer’s location and contact details.`;
}

function suggestionsFor(role) {
  if (role === "admin") {
    return ["Platform snapshot", "Review guide prices", "Open orders", "Unread chats"];
  }
  if (role === "farmer") {
    return ["How do I queue orders?", "Show my active orders", "Guide prices", "How do I add a product?"];
  }
  return ["Find good deals", "How do I order?", "Track my order", "Contact a farmer"];
}

function adminAnswer(text, user, db, farmers, buyers, activeProducts) {
  const open = db.orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const unreadNotes = db.notifications.filter((n) => n.userId === user.id && !n.read);

  if (includesAny(text, ["snapshot", "overview", "dashboard", "stats", "summary"])) {
    return {
      reply: `Platform snapshot:\n• ${farmers.length} farmers, ${buyers.length} buyers\n• ${activeProducts.length} active listings\n• ${open.length} open orders\n• ${db.conversations.length} chats\n• ${unreadNotes.length} unread admin notifications\n• ${db.guidePrices.length} guide prices published`,
      suggestions: ["Who are the farmers?", "Open orders", "Guide prices"],
    };
  }
  if (includesAny(text, ["farmer", "merchant"])) {
    const list = farmers
      .map((f) => `• ${f.farmName} — ${f.name} (${f.location.city}, ${f.location.province}) ${f.verified ? "✓ verified" : "pending"}`)
      .join("\n");
    return { reply: `Farmers on PalayApp:\n${list}`, suggestions: ["Track buyers", "Open orders"] };
  }
  if (includesAny(text, ["buyer", "customer"])) {
    const list = buyers.map((b) => `• ${b.name} — ${b.location.city}`).join("\n");
    return { reply: `Buyers:\n${list}`, suggestions: ["Open orders", "Chats"] };
  }
  if (includesAny(text, ["order"])) {
    const list = open
      .map((o) => {
        const farmer = db.users.find((u) => u.id === o.farmerId);
        const buyer = db.users.find((u) => u.id === o.buyerId);
        return `• ${o.id.toUpperCase()} ${o.status} — ${buyer?.name} → ${farmer?.farmName} (${peso(o.total)})`;
      })
      .join("\n");
    return { reply: `Open orders:\n${list || "None right now."}`, suggestions: ["Queue meaning", "Notifications"] };
  }
  if (includesAny(text, ["chat", "message"])) {
    const list = db.conversations
      .map((c) => {
        const farmer = db.users.find((u) => u.id === c.farmerId);
        const buyer = db.users.find((u) => u.id === c.buyerId);
        return `• ${buyer?.name} ↔ ${farmer?.farmName}: “${c.lastMessage}”`;
      })
      .join("\n");
    return { reply: `Latest chats:\n${list}`, suggestions: ["Notifications", "Settings"] };
  }
  if (includesAny(text, ["notif"])) {
    const list = db.notifications
      .filter((n) => n.userId === user.id)
      .slice(0, 6)
      .map((n) => `• ${n.read ? "" : "(unread) "}${n.title} — ${n.body}`)
      .join("\n");
    return { reply: `Your notifications:\n${list || "You're all caught up."}`, suggestions: ["Settings"] };
  }
  if (includesAny(text, ["setting", "registration", "support"])) {
    const s = db.settings;
    return {
      reply: `Settings:\n• App: ${s.appName}\n• Support: ${s.supportEmail} / ${s.supportPhone}\n• Registration: ${s.allowRegistration ? "open" : "closed"}\n• Order flow: ${s.orderFlow.join(" → ")}`,
      suggestions: ["Guide prices", "Platform snapshot"],
    };
  }
  if (includesAny(text, ["product", "listing"])) {
    const list = activeProducts
      .map((p) => {
        const farmer = db.users.find((u) => u.id === p.farmerId);
        return `• ${p.name} — ${peso(p.price)}/${p.unit} by ${farmer?.farmName} (stock ${p.stock})`;
      })
      .join("\n");
    return { reply: `Active products:\n${list}`, suggestions: ["Guide prices"] };
  }
  return {
    reply:
      "I can track users, farmers, buyers, products, guide prices, orders, chats, notifications, and settings. Try “platform snapshot” or “open orders”.",
    suggestions: suggestionsFor("admin"),
  };
}

function farmerAnswer(text, user, db, activeProducts) {
  const mine = db.orders.filter((o) => o.farmerId === user.id);
  const active = mine.filter((o) => !["completed", "cancelled"].includes(o.status)).sort((a, b) => a.queuePosition - b.queuePosition);
  const myProducts = activeProducts.filter((p) => p.farmerId === user.id);

  if (includesAny(text, ["queue", "manage order", "order status"])) {
    const list =
      active
        .map((o) => {
          const buyer = db.users.find((u) => u.id === o.buyerId);
          return `• #${o.queuePosition} ${o.id.toUpperCase()} — ${buyer?.name}, ${o.status}, ${peso(o.total)}`;
        })
        .join("\n") || "Your queue is empty.";
    return {
      reply: `Use Manage Orders to process work in sequence.\nFlow: queued → confirmed → preparing → ready → completed.\nMove a ticket up or down to change priority, then advance its status when work is done.\n\nYour queue:\n${list}`,
      suggestions: ["Show my products", "Guide prices"],
    };
  }
  if (includesAny(text, ["my order", "active order", "pending"])) {
    const list = active.map((o) => `• ${o.id.toUpperCase()} (${o.status}) ${peso(o.total)}`).join("\n") || "No active orders.";
    return { reply: `Active orders:\n${list}`, suggestions: ["How do I queue orders?"] };
  }
  if (includesAny(text, ["add product", "list product", "new product"])) {
    return {
      reply:
        "Open Products → Add listing. Choose a product from the admin pricing guide, then set your selling price inside that guide’s min–max range. Include stock, harvest date, and a photo. There is no in-app payment — buyers will call or visit you.",
      suggestions: ["Guide prices", "My products"],
    };
  }
  if (includesAny(text, ["my product", "listing", "stock"])) {
    const list = myProducts.map((p) => `• ${p.name} ${peso(p.price)}/${p.unit} — ${p.stock} in stock`).join("\n") || "You have no listings yet.";
    return { reply: `Your listings:\n${list}`, suggestions: ["Guide prices"] };
  }
  if (includesAny(text, ["contact", "location", "profile"])) {
    return {
      reply: `Buyers see this contact card:\n• ${user.farmName}\n• ${user.phone}\n• ${formatLoc(user.location)}\nKeep it accurate in Profile so pickup is easy.`,
      suggestions: ["How do I queue orders?"],
    };
  }
  return {
    reply:
      "I can help with listings, guide prices, order queues, status updates, and buyer messages. Ask “how do I queue orders?” or “show my active orders”.",
    suggestions: suggestionsFor("farmer"),
  };
}

function buyerAnswer(text, user, db, activeProducts) {
  const mine = db.orders.filter((o) => o.buyerId === user.id);
  const open = mine.filter((o) => !["completed", "cancelled"].includes(o.status));

  if (includesAny(text, ["deal", "cheap", "below", "fair", "compare"])) {
    const deals = activeProducts
      .map((p) => {
        const guide = db.guidePrices.find((g) => g.name.toLowerCase() === p.name.toLowerCase());
        if (!guide) return null;
        const delta = p.price - guide.averagePrice;
        return { p, guide, delta };
      })
      .filter(Boolean)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 4)
      .map(({ p, guide, delta }) => {
        const farmer = db.users.find((u) => u.id === p.farmerId);
        const tag = delta < 0 ? `${peso(Math.abs(delta))} below guide` : delta === 0 ? "at guide" : `${peso(delta)} above guide`;
        return `• ${p.name} from ${farmer?.farmName} — ${peso(p.price)}/${p.unit} (${tag})`;
      });
    return {
      reply: `Compared with admin guide prices:\n${deals.join("\n")}\n\nGuide prices are a reference, not a payment. Contact the farmer to complete the purchase.`,
      suggestions: ["How do I order?", "Track my order"],
    };
  }
  if (includesAny(text, ["how do i order", "place order", "buy"])) {
    return {
      reply:
        "Open a product, check the guide price, choose quantity, and place the order. PalayApp then shows the farmer’s phone and farm location. Arrange pickup or delivery directly — the app only tracks status, it does not take payment.",
      suggestions: ["Track my order", "Contact a farmer"],
    };
  }
  if (includesAny(text, ["track", "my order", "status"])) {
    const list =
      open
        .map((o) => {
          const farmer = db.users.find((u) => u.id === o.farmerId);
          return `• ${o.id.toUpperCase()} with ${farmer?.farmName}: ${o.status} (queue #${o.queuePosition || "—"})`;
        })
        .join("\n") || "You have no open orders. Browse the market to place one.";
    return { reply: `Your orders:\n${list}`, suggestions: ["How do I order?"] };
  }
  if (includesAny(text, ["contact", "phone", "location", "where", "farm"])) {
    return {
      reply:
        "On every product and order you’ll see the farmer’s farm name, phone number, and full address. Call or message them in Chat to arrange collection. No payment happens inside PalayApp.",
      suggestions: ["Track my order", "Find good deals"],
    };
  }
  return {
    reply:
      "I can compare listings to market guide prices, explain ordering, help you track status, and point you to a farmer’s location and phone number.",
    suggestions: suggestionsFor("buyer"),
  };
}
