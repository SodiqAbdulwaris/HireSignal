# Executive summary

The AI service provides a deliberately narrow interface and the matching tests cover several difficult scoring cases, including weight redistribution and score clamping. Parse results explicitly flag low-confidence or incomplete data rather than presenting it as clean.

The material launch concerns are lack of an explicit trust boundary around `/parse/` and `/match/`, reading uploads fully into memory before enforcing the configured limit, and allowing startup to continue after an embedding model failure. These should be addressed before the service is reachable outside the backend network.
