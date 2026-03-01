import boto3
from engine.api.config import settings

s3_client = boto3.client(
    "s3",
    region_name=settings.DO_SPACES_REGION,
    endpoint_url=settings.DO_SPACES_ENDPOINT,
    aws_access_key_id=settings.DO_SPACES_KEY,
    aws_secret_access_key=settings.DO_SPACES_SECRET,
)

def upload_image(file, filename: str) -> str:
    s3_client.upload_fileobj(
        file,
        settings.DO_SPACES_BUCKET,
        filename,
        ExtraArgs={"ACL": "public-read", "ContentType": "image/png"}
    )
    
    return f"https://{settings.DO_SPACES_BUCKET}.{settings.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/{filename}"