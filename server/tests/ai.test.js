import { test } from "node:test";
import assert from "node:assert/strict";
import { answerAssistant } from "../ai.js";
import { createSeed } from "../seed.js";

function dbFor(roleEmail) {
  const seed = createSeed();
  const user = seed.users.find((u) => u.email === roleEmail);
  return {
    user,
    db: {
      users: seed.users,
      products: seed.products,
      guidePrices: seed.guidePrices,
      orders: seed.orders,
      conversations: seed.conversations,
      messages: seed.messages,
      notifications: seed.notifications,
      settings: seed.settings,
    },
  };
}

test("assistant: empty message returns a prompt and suggestions", () => {
  const { user, db } = dbFor("ana@palayapp.com");
  const res = answerAssistant({ role: "buyer", user, message: "  ", db });
  assert.match(res.reply, /ask me anything/i);
  assert.ok(res.suggestions.length > 0);
});

test("assistant: payment questions never offer checkout", () => {
  const { user, db } = dbFor("ana@palayapp.com");
  const res = answerAssistant({ role: "buyer", user, message: "Can I pay with GCash?", db });
  assert.match(res.reply, /does not process payments/i);
  assert.doesNotMatch(res.reply, /checkout|card number|wallet/i);
});

test("assistant: admin snapshot includes counts", () => {
  const { user, db } = dbFor("admin@palayapp.com");
  const res = answerAssistant({ role: "admin", user, message: "platform snapshot", db });
  assert.match(res.reply, /farmers/);
  assert.match(res.reply, /buyers/);
  assert.match(res.reply, /guide prices/);
});

test("assistant: farmer queue help mentions the status flow", () => {
  const { user, db } = dbFor("rosa@palayapp.com");
  const res = answerAssistant({ role: "farmer", user, message: "How do I queue orders?", db });
  assert.match(res.reply, /queued → confirmed → preparing → ready → completed/);
});

test("assistant: buyer deals compare listings to the guide", () => {
  const { user, db } = dbFor("ana@palayapp.com");
  const res = answerAssistant({ role: "buyer", user, message: "Find good deals below market", db });
  assert.match(res.reply, /guide/i);
  assert.match(res.reply, /contact the farmer/i);
});

test("assistant: guide price question lists averages", () => {
  const { user, db } = dbFor("admin@palayapp.com");
  const res = answerAssistant({ role: "admin", user, message: "Show guide prices", db });
  assert.match(res.reply, /Premium White Rice|Red Onion|range/);
});
