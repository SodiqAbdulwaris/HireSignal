# Observation — useful quality and explainability controls

The response schemas constrain score ranges and parsing output shape. Matching tests cover zero-skill jobs, custom weights, clamping, and score redistribution. Parse tests exercise sparse input, OCR confidence, multilingual examples, and unsupported-language fallback. Returning `needs_review` and fallback reasons is a strong safeguard against presenting uncertain extraction as authoritative data.
