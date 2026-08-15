import { test, before } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

const local = new MemoryStorage();
const session = new MemoryStorage();
globalThis.localStorage = local;
globalThis.sessionStorage = session;

let saveToken;
let getToken;

before(async () => {
  ({ saveToken, getToken } = await import("./api.js"));
});

test("session: remember me stores the token in localStorage", () => {
  local.map.clear();
  session.map.clear();
  saveToken("tok-remember", true);
  assert.equal(local.getItem("palayapp_token"), "tok-remember");
  assert.equal(session.getItem("palayapp_token"), null);
  assert.equal(getToken(), "tok-remember");
});

test("session: without remember me the token is session-only", () => {
  local.map.clear();
  session.map.clear();
  saveToken("tok-session", false);
  assert.equal(session.getItem("palayapp_token"), "tok-session");
  assert.equal(local.getItem("palayapp_token"), null);
  assert.equal(getToken(), "tok-session");
});

test("session: clearing the token removes both stores", () => {
  saveToken("tok", true);
  saveToken(null);
  assert.equal(getToken(), null);
  assert.equal(local.getItem("palayapp_token"), null);
  assert.equal(session.getItem("palayapp_token"), null);
});

test("session: getToken prefers a remembered local token", () => {
  local.map.clear();
  session.map.clear();
  local.setItem("palayapp_token", "local-tok");
  session.setItem("palayapp_token", "session-tok");
  assert.equal(getToken(), "local-tok");
});
