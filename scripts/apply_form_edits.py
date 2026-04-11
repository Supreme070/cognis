#!/usr/bin/env python3
"""
Patch the 3 footer newsletter forms with a Web3Forms endpoint.

We keep the Framer visual structure (class names, styles, button markup) and
only add action/method/hidden inputs + rename the email field. Hidden honeypot
inputs from the template are preserved as extra spam defense; Web3Forms will
ignore them since they submit empty.

WEB3FORMS_ACCESS_KEY is inserted as a literal placeholder that must be
replaced with a real key before deploy.
"""
import pathlib
import re

HTML = pathlib.Path("aeline_framer_website.html")

FORM_OPEN_OLD = '<form class="framer-1yovbvh" style="will-change:transform;opacity:0;transform:translateY(10px)">'
FORM_OPEN_NEW = (
    '<form class="framer-1yovbvh" action="https://api.web3forms.com/submit" '
    'method="POST" style="will-change:transform;opacity:0;transform:translateY(10px)">\n'
    '                    <input type="hidden" name="access_key" value="{WEB3FORMS_ACCESS_KEY}" />\n'
    '                    <input type="hidden" name="from_name" value="cognis.group newsletter" />\n'
    '                    <input type="hidden" name="subject" value="New newsletter signup — cognis.group" />\n'
    '                    <input type="hidden" name="redirect" value="https://cognis.group/thanks.html" />'
)

EMAIL_OLD = '<input type="email" required="" name="Email"'
EMAIL_NEW = '<input type="email" required="" name="email"'


def main():
    txt = HTML.read_text()
    orig = txt
    c1 = txt.count(FORM_OPEN_OLD)
    assert c1 == 3, f"expected 3 form opens, found {c1}"
    txt = txt.replace(FORM_OPEN_OLD, FORM_OPEN_NEW)
    c2 = txt.count(EMAIL_OLD)
    assert c2 == 3, f"expected 3 email inputs, found {c2}"
    txt = txt.replace(EMAIL_OLD, EMAIL_NEW)
    if txt != orig:
        HTML.write_text(txt)
    print(f"patched {c1} form opens, {c2} email inputs")


if __name__ == "__main__":
    main()
