import uuid

import boto3
from botocore.config import Config

from app.core.config import settings

s3_client = boto3.client(
    "s3",
    region_name=settings.aws_region,
    config=Config(signature_version="s3v4"),
)


def generate_upload_url(*, file_extension: str) -> dict:
    """Generate a presigned URL for uploading a resume to S3.

    Returns dict with `upload_url` (PUT to this) and `key` (store in DB).
    """
    key = f"resumes/{uuid.uuid4()}{file_extension}"

    url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.s3_bucket_name,
            "Key": key,
            "ContentType": "application/pdf",
        },
        ExpiresIn=300,  # 5 minutes
    )

    return {"upload_url": url, "key": key}


def generate_download_url(*, key: str) -> str:
    """Generate a presigned URL for downloading a file from S3.

    URL expires in 15 minutes for security.
    """
    return s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.s3_bucket_name,
            "Key": key,
        },
        ExpiresIn=900,  # 15 minutes
    )
