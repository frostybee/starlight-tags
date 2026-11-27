---
'starlight-tags': patch
---

Fixes localized tag labels and descriptions in `tags.yml` on root locale pages. Labels keyed with `root` or the root locale's `lang` (for example `zh-TW`) are now used, and locale keys match case-insensitively. Tag pages for prefixed locales (for example `/de/tags/components/`) now show that locale's label and description instead of the root locale's. (#12)
