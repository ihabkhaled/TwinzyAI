# Engineering Standards Check

- Tests precede implementation and reproduce the live array-element mismatch.
- Provider data remains bounded, normalized at one owner, Zod-validated, language-checked, and
  safety-filtered.
- No raw response, prompt, image, trait, payment token, or secret is logged.
- No model ID is hardcoded; the existing maximum-three chain remains configured.
- No inline suppression, unsafe type escape, new dependency, or architecture bypass.
- Generated `.ai` files are rebuilt from authored documentation only.
- No new permanent rule is needed; the escaped-test pattern is recorded in known pitfalls.

