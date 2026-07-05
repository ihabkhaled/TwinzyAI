# Manual QA Checklist

Device pass (real phone or 320/375/414px emulation, both themes):
- [ ] Landing loads < 3s, no horizontal scroll, start button >= 44px.
- [ ] Game page: consent unchecked -> analyze disabled/erroring politely.
- [ ] Camera and gallery both open from the upload control on mobile.
- [ ] Wrong file type / > 5MB file -> friendly inline error, no crash.
- [ ] Analyze shows processing state; result shows traits, matches, scores, disclaimer.
- [ ] Retry clears everything (preview revoked, no stale state).
- [ ] Share produces safe text (name + score only), clipboard fallback works.
- [ ] Privacy/Terms/Help pages readable and non-technical.
- [ ] Airplane mode -> network error message, retry works after reconnect.
- [ ] No photo appears in devtools storage (localStorage/sessionStorage/IndexedDB).
- [ ] PWA installable; icon/name correct; standalone launch works.
