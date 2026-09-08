from fastapi import APIRouter, Depends, File, UploadFile

from app.config.settings import get_settings
from app.core.auth import require_service_key
from app.core.exceptions import FileTooLargeError
from app.schemas.resume import ParsedCandidate
from app.services.parse_service import parse_resume_service

router = APIRouter(dependencies=[Depends(require_service_key)])
settings = get_settings()


CHUNK_SIZE = 1024 * 1024


@router.post("/parse/", response_model=ParsedCandidate)
async def parse_resume(file: UploadFile = File(...)):
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    size = 0
    while chunk := await file.read(CHUNK_SIZE):
        size += len(chunk)
        if size > max_bytes:
            raise FileTooLargeError(
                filename=file.filename,
                size_mb=round(size / (1024 * 1024), 2),
                max_mb=settings.MAX_FILE_SIZE_MB,
            )

    await file.seek(0)
    return await parse_resume_service(file)