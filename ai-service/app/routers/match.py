from fastapi import APIRouter, Depends
from app.core.auth import require_service_key
from app.schemas.match import MatchRequest, MatchResponse
from app.services.matching_service import match_candidates_service
from app.services.embedding_service import EmbeddingService, get_embedding_service

router = APIRouter(prefix="/match", tags=["Match"], dependencies=[Depends(require_service_key)])

@router.post("/", response_model=MatchResponse)
async def match_candidates(
    request: MatchRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
):
    return await match_candidates_service(request, embedding_service)