#!/usr/bin/env python3
"""Wire real Web3Forms keys + distinct contact/newsletter metadata + honeypot.

Runs over every HTML file containing the placeholder access_key. Forms are
identified by their Framer class name:

  framer-1h74s3j → real Contact Us form (name + email + message)
  framer-1yovbvh → Newsletter signup form (email only)

For each form we:
  1. Replace {WEB3FORMS_ACCESS_KEY} with the correct real key.
  2. Rewrite from_name, subject, and submit button text to match purpose.
  3. Insert the Web3Forms honeypot field (name="botcheck") just after the
     access_key hidden input. Web3Forms auto-rejects submissions with
     botcheck=true; bots fill everything, humans don't see it.

This script is idempotent — re-running after a prerender re-applies the fix
to freshly-snapshotted files.
"""
import pathlib
import re
import sys

KEY_CONTACT = "5017c7dc-5bf0-4086-9f54-5171783a95ba"
KEY_NEWSLETTER = "6e2d0eb5-2d17-4183-8662-83a3487d2703"

CONTACT_CLASS = "framer-1h74s3j"
NEWSLETTER_CLASS = "framer-1yovbvh"

CONTACT_META = {
    "from_name": "cognis.group contact form",
    "subject": "New contact form submission — cognis.group",
    "button": "Send message",
    "key": KEY_CONTACT,
}
NEWSLETTER_META = {
    "from_name": "cognis.group newsletter",
    "subject": "New newsletter signup — cognis.group",
    "button": "Subscribe",
    "key": KEY_NEWSLETTER,
}

# Honeypot — inserted once per form. display:none hides it; tabindex=-1 +
# aria-hidden keep it away from assistive tech and keyboard users.
HONEYPOT = (
    '<input type="checkbox" name="botcheck" '
    'style="display:none !important" tabindex="-1" autocomplete="off" '
    'aria-hidden="true" />'
)

ROOT = pathlib.Path(__file__).resolve().parent.parent


def patch_form(block: str, meta: dict) -> str:
    """Apply a single form's rewrites."""
    out = block

    # 1. access_key — swap placeholder for real key.
    out = re.sub(
        r'(name="access_key"[^>]*value=")\{WEB3FORMS_ACCESS_KEY\}(")',
        lambda m: m.group(1) + meta["key"] + m.group(2),
        out,
    )

    # 2. from_name — replace whatever's there.
    out = re.sub(
        r'(name="from_name"[^>]*value=")[^"]*(")',
        lambda m: m.group(1) + meta["from_name"] + m.group(2),
        out,
    )

    # 3. subject — the first hidden subject input (not the visible
    #    <input name="subject"> that may also appear as a form field).
    #    We target the hidden one by requiring type="hidden".
    out = re.sub(
        r'(<input[^>]*type="hidden"[^>]*name="subject"[^>]*value=")[^"]*(")',
        lambda m: m.group(1) + meta["subject"] + m.group(2),
        out,
    )

    # 4. Submit button inner text — Framer wraps label in nested spans, and
    #    the label appears twice (hover + default states). Replace both.
    #    Pattern: <button type="submit"…>…Subscribe…Subscribe…</button>
    def rewrite_button(m):
        body = m.group(2)
        body = re.sub(r'Subscribe', meta["button"], body)
        return m.group(1) + body + m.group(3)

    out = re.sub(
        r'(<button[^>]*type="submit"[^>]*>)([\s\S]*?)(</button>)',
        rewrite_button,
        out,
    )

    # 5. Honeypot — insert once, immediately after the access_key input.
    if 'name="botcheck"' not in out:
        out = re.sub(
            r'(<input[^>]*name="access_key"[^>]*/>\s*)',
            lambda m: m.group(1) + HONEYPOT + "\n                    ",
            out,
            count=1,
        )

    return out


FORM_RE = re.compile(r'<form\b[\s\S]*?</form>')


def patch_file(path: pathlib.Path) -> tuple[int, int]:
    """Return (#contact patches, #newsletter patches) applied."""
    src = path.read_text()
    if "{WEB3FORMS_ACCESS_KEY}" not in src and "name=\"botcheck\"" in src:
        return (0, 0)  # already wired and honeypotted

    contacts = newsletters = 0

    def sub(m):
        nonlocal contacts, newsletters
        block = m.group(0)
        if CONTACT_CLASS in block:
            contacts += 1
            return patch_form(block, CONTACT_META)
        if NEWSLETTER_CLASS in block:
            newsletters += 1
            return patch_form(block, NEWSLETTER_META)
        return block  # unknown form — leave alone

    new = FORM_RE.sub(sub, src)
    if new != src:
        path.write_text(new)
    return (contacts, newsletters)


def main():
    targets = sorted(
        list(ROOT.glob("*.html"))
        + list(ROOT.glob("blog/*/index.html"))
        + list(ROOT.glob("our-services/*/index.html"))
    )
    # Skip backups.
    targets = [p for p in targets if ".before-" not in p.name and p.name != "cognis_base.original.html"]

    total_c = total_n = 0
    for p in targets:
        c, n = patch_file(p)
        if c or n:
            print(f"  {p.relative_to(ROOT)}: contact={c} newsletter={n}")
        total_c += c
        total_n += n

    print(f"\ntotals: {total_c} contact forms, {total_n} newsletter forms patched")
    # Sanity check: there should be exactly 1 contact form on the site.
    if total_c != 1:
        print(f"WARNING: expected 1 contact form, found {total_c}", file=sys.stderr)


if __name__ == "__main__":
    main()
