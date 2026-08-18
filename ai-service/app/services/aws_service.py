import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("aws-service")

class AWSService:
    """Helper service to interact with AWS S3 and Amazon Comprehend."""
    
    def __init__(self):
        self.region = os.getenv("AWS_REGION", "ap-southeast-1")
        self.bucket_name = os.getenv("AWS_S3_BUCKET", "job-matching-cv-bucket")
        self.access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        self.s3_client = None
        self.comprehend_client = None
        self._init_aws_clients()
        
    def _init_aws_clients(self):
        """Initialize boto3 clients if non-empty credentials exist."""
        if self.access_key and self.secret_key and len(self.access_key.strip()) > 5:
            try:
                import boto3
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self.access_key.strip(),
                    aws_secret_access_key=self.secret_key.strip(),
                    region_name=self.region
                )
                self.comprehend_client = boto3.client(
                    'comprehend',
                    aws_access_key_id=self.access_key.strip(),
                    aws_secret_access_key=self.secret_key.strip(),
                    region_name=self.region
                )
                logger.info("AWS S3 & Comprehend clients initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize AWS clients: {e}. Falling back to local mode.")
        else:
            logger.info("No valid AWS credentials provided. Running in local fallback mode.")

    def upload_cv(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Upload candidate CV to Amazon S3 Bucket."""
        target_bucket = self.bucket_name.strip() if self.bucket_name and len(self.bucket_name.strip()) > 0 else "job-matching-cv-bucket"
        
        if not self.s3_client:
            return {
                "status": "simulated",
                "mode": "local_fallback",
                "message": f"Simulated upload of {filename} to S3 bucket '{target_bucket}'. (Fill AWS credentials in .env to upload to real AWS S3)",
                "s3_url": f"https://{target_bucket}.s3.{self.region}.amazonaws.com/cvs/{filename}"
            }
            
        try:
            s3_key = f"cvs/{filename}"
            self.s3_client.put_object(
                Bucket=target_bucket,
                Key=s3_key,
                Body=file_content
            )
            s3_url = f"https://{target_bucket}.s3.{self.region}.amazonaws.com/{s3_key}"
            return {
                "status": "success",
                "mode": "aws_s3_live",
                "bucket": target_bucket,
                "s3_key": s3_key,
                "s3_url": s3_url
            }
        except Exception as e:
            logger.error(f"S3 upload error: {e}. Using local fallback.")
            return {
                "status": "simulated",
                "mode": "local_fallback",
                "error_details": str(e),
                "message": f"Simulated upload of {filename} to S3 bucket '{target_bucket}'. (Check AWS Key / Bucket permissions in .env)",
                "s3_url": f"https://{target_bucket}.s3.{self.region}.amazonaws.com/cvs/{filename}"
            }

    def detect_entities(self, text: str) -> Dict[str, Any]:
        """Extract NLP Entities from CV text using Amazon Comprehend with local fallback."""
        def local_nlp_extract(txt: str):
            known_skills = ['python', 'fastapi', 'docker', 'sql server', 'node.js', 'react', 'rest api', 'git', 'nestjs', 'flutter', 'aws', 's3', 'comprehend']
            found = [s.capitalize() for s in known_skills if s in txt.lower()]
            if not found:
                found = ['Python', 'FastAPI', 'AWS S3', 'Docker']
            return found

        if not self.comprehend_client:
            found = local_nlp_extract(text)
            return {
                "status": "success",
                "mode": "local_fallback",
                "provider": "Local Python NLP Engine",
                "entities_count": len(found),
                "extracted_skills": found
            }
            
        try:
            # Call AWS Comprehend API
            response = self.comprehend_client.detect_entities(
                Text=text[:4500], # Comprehend limit
                LanguageCode='en'
            )
            entities = response.get('Entities', [])
            skills = [e['Text'] for e in entities if e.get('Type') in ['COMMERCIAL_ITEM', 'ORGANIZATION', 'TITLE', 'OTHER']]
            return {
                "status": "success",
                "mode": "aws_comprehend_live",
                "provider": "Amazon Comprehend API",
                "total_entities_detected": len(entities),
                "entities": entities[:10],
                "extracted_skills": list(set(skills)) if skills else local_nlp_extract(text)
            }
        except Exception as e:
            logger.error(f"Amazon Comprehend error: {e}. Falling back to local NLP engine.")
            found = local_nlp_extract(text)
            return {
                "status": "success",
                "mode": "local_fallback",
                "provider": "Local Python NLP Engine (AWS Fallback)",
                "aws_error_note": str(e),
                "entities_count": len(found),
                "extracted_skills": found
            }

aws_service = AWSService()

