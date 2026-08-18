import os
import sys

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.aws_service import aws_service

def run_test():
    print("=" * 60)
    print("🚀 BẮT ĐẦU KIỂM TRA KẾT NỐI DỊCH VỤ AWS (S3 & COMPREHEND)")
    print("=" * 60)

    # 1. Test Amazon S3 Upload
    sample_cv_text = """
    Candidate: Nguyen Van A
    Role: Senior Python Developer
    Skills: Python, FastAPI, Docker, SQL Server, AWS S3, Amazon Comprehend, React, REST API, Git.
    Experience: 3 years building scalable microservices with Python and AWS Cloud.
    """
    
    cv_filename = "sample_cv_test.txt"
    print(f"\n1. 📤 Kiểm tra upload file CV '{cv_filename}' lên S3...")
    upload_result = aws_service.upload_cv(sample_cv_text.encode('utf-8'), cv_filename)
    print("   Trạng thái:", upload_result.get("status"))
    print("   Chế độ (Mode):", upload_result.get("mode"))
    print("   Chi tiết:", upload_result.get("message") or upload_result.get("s3_url"))

    # 2. Test Amazon Comprehend NLP
    print(f"\n2. 🧠 Kiểm tra bóc tách thực thể NLP (CV Entity Extraction)...")
    nlp_result = aws_service.detect_entities(sample_cv_text)
    print("   Trạng thái:", nlp_result.get("status"))
    print("   Chế độ (Mode):", nlp_result.get("mode"))
    print("   Provider:", nlp_result.get("provider"))
    print("   Danh sách kỹ năng bóc tách:", nlp_result.get("extracted_skills"))

    print("\n" + "=" * 60)
    print("✅ HOÀN THÀNH BÀI KIỂM TRA AWS!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
