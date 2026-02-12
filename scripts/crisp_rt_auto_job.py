#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Crisp RT auto job — Annuaire des Entreprises

But : classer automatiquement les conversations Crisp en ajoutant un segment métier,
pour déclencher un bot/scenario Crisp basé sur segments (RT auto).

- Filtre : email valide uniquement
- Analyse : sujet + dernier message utilisateur
- Tag : ajoute 1 segment métier + un marqueur "rt-auto-processed" (anti-double-traitement)

Env requis:
- CRISP_IDENTIFIER
- CRISP_KEY
- CRISP_WEBSITE_ID

Env optionnels:
- RT_AUTO_ALLOWED_ORIGINS (ex: "contact_form,email,chat") défaut: "contact_form,email"
- RT_AUTO_MAX_PAGES défaut: 5
- RT_AUTO_PER_PAGE défaut: 20
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import time
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set

import requests


# -----------------------------
# Segments & mots-clés
# -----------------------------

TARGET_SEGMENTS: Set[str] = {
    "confusion",
    "supp données",
    "correction données",
    "démarches pro",
    "retraite",
    "usurpation adresse",
}

PROCESSED_MARKER_SEGMENT = "rt-auto-processed"

# Ordre = priorité (le premier match gagne)
CLASSIFICATION_RULES = [
    {
        "segment": "supp données",
        "keywords": [
            "supprimer",
            "suppression",
            "données personnelles",
            "diffusion",
            "rgpd",
            "diffusible",
        ],
    },
    {
        "segment": "correction données",
        "keywords": [
            "pas à jour",
            "erreur",
            "données erronées",
        ],
    },
    {
        "segment": "démarches pro",
        "keywords": [
            "réactiver",
            "fermer",
        ],
    },
    {"segment": "retraite", "keywords": ["retraite"]},
    {"segment": "usurpation adresse", "keywords": ["domicilié", "domiciliée"]},
    {
        "segment": "confusion",
        "keywords": [
            "livraison",
            "commande",
            "facture",
            "prélèvement",
            "abonnement",
        ],
    },
]

EMAIL_RE = re.compile(r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$", re.IGNORECASE)


def norm(s: str) -> str:
    """Minuscule + suppression accents + espaces normalisés."""
    s = s or ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"\s+", " ", s).strip()
    return s


def email_is_valid(email: Optional[str]) -> bool:
    if not email:
        return False
    email = email.strip()
    return bool(EMAIL_RE.match(email))


def pick_segment(text: str) -> Optional[str]:
    t = norm(text)
    for rule in CLASSIFICATION_RULES:
        seg = rule["segment"]
        kws = [norm(k) for k in rule.get("keywords", []) if k and k.strip()]
        if any(k in t for k in kws):
            return seg
    return None


# -----------------------------
# Crisp client minimal
# -----------------------------

@dataclass
class CrispAuth:
    identifier: str
    key: str
    website_id: str


class CrispClient:
    def __init__(self, auth: CrispAuth, timeout_s: int = 20) -> None:
        self.auth = auth
        self.base = "https://api.crisp.chat"
        token = base64.b64encode(f"{auth.identifier}:{auth.key}".encode("utf-8")).decode("ascii")
        self.headers = {
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
            "User-Agent": "annuaire-api/crisp-rt-auto-job/1.0",
        }
        self.timeout_s = timeout_s

    def _req(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = self.base + path
        r = requests.request(method, url, headers=self.headers, timeout=self.timeout_s, **kwargs)
        if r.status_code >= 400:
            raise RuntimeError(f"Crisp API {r.status_code} {method} {path}: {r.text[:600]}")
        data = r.json()
        if isinstance(data, dict) and data.get("error") is True:
            raise RuntimeError(f"Crisp API logical error {method} {path}: {data}")
        return data

    def list_conversations(self, page: int, per_page: int) -> List[Dict[str, Any]]:
        params = {
            "per_page": str(per_page),
            "include_empty": "0",
            "filter_not_resolved": "1",
            "order_date_created": "1",
        }
        path = f"/v1/website/{self.auth.website_id}/conversations/{page}"
        res = self._req("GET", path, params=params)
        return res.get("data", []) or []

    def get_conversation_meta(self, session_id: str) -> Dict[str, Any]:
        path = f"/v1/website/{self.auth.website_id}/conversation/{session_id}/meta"
        res = self._req("GET", path)
        return res.get("data", {}) or {}

    def patch_conversation_meta(self, session_id: str, payload: Dict[str, Any]) -> None:
        path = f"/v1/website/{self.auth.website_id}/conversation/{session_id}/meta"
        self._req("PATCH", path, data=json.dumps(payload))

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        path = f"/v1/website/{self.auth.website_id}/conversation/{session_id}/messages"
        res = self._req("GET", path)
        return res.get("data", []) or []


# -----------------------------
# Job logic
# -----------------------------

def build_text(meta: Dict[str, Any], messages: List[Dict[str, Any]]) -> str:
    subject = meta.get("subject") or ""
    last_user_text = ""
    for msg in reversed(messages):
        if msg.get("from") == "user" and msg.get("type") in ("text", "note"):
            c = msg.get("content")
            if isinstance(c, str) and c.strip():
                last_user_text = c
                break
    return f"{subject}\n\n{last_user_text}".strip()


def parse_allowed_origins() -> Set[str]:
    raw = (os.getenv("RT_AUTO_ALLOWED_ORIGINS") or "contact_form,email").strip()
    items = [norm(x).replace(" ", "_") for x in raw.split(",") if x.strip()]
    return set(items)


def origin_allowed(meta_origin: Optional[str], allowed: Set[str]) -> bool:
    if not meta_origin:
        return True
    o = norm(meta_origin).replace(" ", "_")
    return o in allowed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Log uniquement, pas de PATCH")
    ap.add_argument("--max-pages", type=int, default=int(os.getenv("RT_AUTO_MAX_PAGES") or "5"))
    ap.add_argument("--per-page", type=int, default=int(os.getenv("RT_AUTO_PER_PAGE") or "20"))
    ap.add_argument("--sleep", type=float, default=0.0)
    args = ap.parse_args()

    identifier = (os.getenv("CRISP_IDENTIFIER") or "").strip()
    key = (os.getenv("CRISP_KEY") or "").strip()
    website_id = (os.getenv("CRISP_WEBSITE_ID") or "").strip()
    if not (identifier and key and website_id):
        print("Missing env vars: CRISP_IDENTIFIER, CRISP_KEY, CRISP_WEBSITE_ID")
        return 2

    allowed = parse_allowed_origins()
    client = CrispClient(CrispAuth(identifier=identifier, key=key, website_id=website_id))

    processed = 0
    classified = 0
    skipped = 0

    for page in range(1, args.max_pages + 1):
        convs = client.list_conversations(page=page, per_page=args.per_page)
        if not convs:
            break

        for conv in convs:
            session_id = conv.get("session_id")
            if not session_id:
                continue

            try:
                meta = client.get_conversation_meta(session_id)
            except Exception as e:
                print(f"[WARN] meta fetch failed session={session_id}: {e}")
                continue

            if not origin_allowed(meta.get("origin"), allowed):
                skipped += 1
                continue

            segments = set(meta.get("segments") or [])
            if PROCESSED_MARKER_SEGMENT in segments:
                skipped += 1
                continue
            if segments.intersection(TARGET_SEGMENTS):
                skipped += 1
                continue

            if not email_is_valid(meta.get("email")):
                skipped += 1
                continue

            try:
                msgs = client.get_messages(session_id)
            except Exception as e:
                print(f"[WARN] messages fetch failed session={session_id}: {e}")
                continue

            text = build_text(meta, msgs)
            segment = pick_segment(text)
            if not segment:
                skipped += 1
                continue

            current = list(meta.get("segments") or [])
            new_segments = list(dict.fromkeys(current + [segment, PROCESSED_MARKER_SEGMENT]))

            payload: Dict[str, Any] = {"segments": new_segments}

            data = meta.get("data") if isinstance(meta.get("data"), dict) else {}
            data["rt_auto_segment"] = segment
            data["rt_auto_ts"] = int(time.time())
            payload["data"] = data

            processed += 1
            print(f"[OK] session={session_id} -> segment='{segment}'")

            if not args.dry_run:
                try:
                    client.patch_conversation_meta(session_id, payload)
                    classified += 1
                except Exception as e:
                    print(f"[WARN] patch failed session={session_id}: {e}")

        if args.sleep:
            time.sleep(args.sleep)

    print(f"Done. processed={processed} classified={classified} skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
