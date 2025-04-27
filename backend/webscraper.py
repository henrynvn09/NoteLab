import requests
from googlesearch import search
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text
from io import BytesIO
import random
import time

def scrape_website(url):
    response = requests.get(url)
    html = response.text
    content_type = response.headers.get('content-type')
    all_text = ""
    images = []
    
    if content_type == "application/pdf":
        all_text = extract_text(BytesIO(response.content))
    else:
        soup = BeautifulSoup(html, "html.parser")
        all_text = soup.get_text(separator=' ', strip=True)
        for img_tag in soup.find_all('img'):
            img_url = img_tag.get('src')
            if img_url:
                images.append(img_url)

    return (all_text, images)

# retry 3 times in case google blocks request
def safe_search(query, num_sites):
    for _ in range(3):  # Try 3 times
        try:
            return list(search(query, num=10, start=0, stop=num_sites))
        except Exception as e:
            print(f"Search failed, retrying... {e}")
            time.sleep(random.uniform(1, 3))
    raise Exception("Failed search after 3 retries")

def search_web(query, num_sites=0):
    data = []   
    res = safe_search(query, num_sites)

    for url in res:
        text, image = scrape_website(url)
        data.append({ 'url' : url, 'text' : text, 'image' : image })

    return data