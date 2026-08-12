import re
from bs4 import BeautifulSoup

def clean_html(raw_html: str) -> str:
    """
    Làm sạch HTML:
    - Bỏ thẻ script, style, nav, footer, header
    - Chuyển thẻ <br>, <li> thành xuống dòng \n
    - Xóa khoảng trắng thừa
    """
    if not raw_html:
        return ""
    
    soup = BeautifulSoup(raw_html, "html.parser")
    
    # Loại bỏ các thẻ không chứa nội dung chính
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()
        
    # Chuyển đổi một số thẻ thành xuống dòng để text dễ đọc hơn
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for p in soup.find_all("p"):
        p.append("\n\n")
    for li in soup.find_all("li"):
        li.insert(0, "- ")
        li.append("\n")
        
    text = soup.get_text(separator=" ")
    text = text.replace("\xa0", " ")
    
    # Chuẩn hóa khoảng trắng: thay thế chuỗi khoảng trắng dài bằng 1 khoảng trắng
    text = re.sub(r' +', ' ', text)
    # Loại bỏ khoảng trắng ở đầu dòng nhưng giữ lại \n
    text = re.sub(r'\n +', '\n', text)
    # Gom nhiều dòng \n liên tiếp thành tối đa 2 dòng \n
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()
