#!/usr/bin/env python3
import hashlib, os, sys, time, feedparser
from datetime import datetime, timezone
import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # create this in Vercel
TABLE = f"{SUPABASE_URL}/rest/v1/receipts"
LINK = f"{SUPABASE_URL}/rest/v1/entity_receipt"

HEAD = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type":"application/json"}

FEEDS = [
  ("AI","https://openai.com/blog/rss.xml"),
  ("AI","https://www.anthropic.com/news/rss.xml"),
  ("Energy","https://www.helionenergy.com/feed/"),
  ("Biotech","https://www.altoslabs.com/news/feed/"),
  ("Thielverse","https://ir.tesla.com/press-releases/feed"),
]

def canon_date(e):
  if getattr(e, "published_parsed", None):
    return datetime(*e.published_parsed[:6], tzinfo=timezone.utc).isoformat()
  return datetime.now(timezone.utc).isoformat()

def mkhash(url, title, dt):
  s = f"{url.strip().lower()}|{dt[:10]}|{title.strip().lower()}"
  return hashlib.sha256(s.encode()).hexdigest()[:24]

def guess_entities(title, url):
  t = f"{title} {url}".lower()
  out = []
  if "openai" in t: out.append("openai")
  if "anthropic" in t: out.append("anthropic")
  if "helion" in t: out.append("helion")
  if "tesla" in t: out.append("tesla")
  if "altos" in t: out.append("altos")
  if "altman" in t or "sama" in t: out.append("sama")
  return list(dict.fromkeys(out))[:4]

def upsert_receipt(frontier, src, title, url, dt):
  h = mkhash(url, title, dt)
  data = {"source": src, "title": title, "url": url, "published_at": dt, "frontier": frontier, "hash": h, "visible": True}
  r = requests.post(f"{TABLE}?on_conflict=hash", headers=HEAD, json=data, timeout=10)
  if r.status_code not in (201, 409): print("insert err", r.status_code, r.text)
  return h

def link_entities(hash_id, slugs):
  # fetch receipt id
  r = requests.get(f"{TABLE}?select=id&hash=eq.{hash_id}", headers=HEAD, timeout=10).json()
  if not r: return
  rid = r[0]["id"]
  for s in slugs:
    e = requests.get(f"{SUPABASE_URL}/rest/v1/entities?select=id&slug=eq.{s}", headers=HEAD, timeout=10).json()
    if not e: continue
    payload = {"entity_id": e[0]["id"], "receipt_id": rid, "role": "mentioned"}
    requests.post(f"{LINK}?on_conflict=entity_id,receipt_id", headers=HEAD, json=payload, timeout=10)

def run():
  for frontier, feed in FEEDS:
    f = feedparser.parse(feed)
    for e in f.entries[:10]:
      title = e.title.strip()
      link = e.link
      dt = canon_date(e)
      h = upsert_receipt(frontier, "rss", title, link, dt)
      link_entities(h, guess_entities(title, link))
      time.sleep(0.1)

if __name__ == "__main__":
  run()
