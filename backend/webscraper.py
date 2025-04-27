import requests
from dotenv import load_dotenv
from googlesearch import search
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text
from io import BytesIO
import random
import time
import sys
import os

load_dotenv()

def is_likely_diagram(image_url, metadata=None):
    """Check if the image URL or metadata suggests it's an educational diagram."""
    diagram_keywords = ["diagram", "flowchart", "chart", "concept", "explanation", "graph", "visual", "equations"]
    
    url_lower = image_url.lower()
    if any(keyword in url_lower for keyword in diagram_keywords):
        return True

    if metadata:
        title = metadata.get('title', '').lower()
        snippet = metadata.get('snippet', '').lower()
        if any(keyword in title for keyword in diagram_keywords) or any(keyword in snippet for keyword in diagram_keywords):
            return True

    return False

def is_image_valid(image_url):
    """Check if the image URL is valid by making a request and ensuring the status code is 200."""
    try:
        response = requests.get(image_url)
        # Check if the image returns a valid status code
        if response.status_code == 200:
            # Check if it's an image by verifying its content type
            content_type = response.headers.get('Content-Type', '')
            if 'image' in content_type:
                return True
    except requests.exceptions.RequestException:
        pass
    return False

def google_image_search(query):
    # perform a smarter image search, filtering for educational diagrams/equations.
    api_key = os.getenv('GEMINI_API_KEY')
    cx = os.getenv('SEARCH_ENGINE_ID')
     
    search_url = f"https://www.googleapis.com/customsearch/v1?q={query}&searchType=image&key={api_key}&cx={cx}&num=3"
    
    response = requests.get(search_url)
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None
    
    results = response.json()
    items = results.get('items', [])

    for item in items:
        image_url = item.get('link')
        metadata = {
            "title": item.get('title', ''),
            "snippet": item.get('snippet', '')
        }
        # return the first good match
        if is_image_valid(image_url) and is_likely_diagram(image_url, metadata):
            return image_url  

    # fallback: return the first image if no perfect match
    for item in items:
        image_url = item.get('link')
        if is_image_valid(image_url):
            return image_url
    
    return None

def scrape_website(url):
    response = requests.get(url)
    html = response.text
    content_type = response.headers.get('content-type')
    all_text = ""
    
    if content_type == "application/pdf":
        try:
            all_text = extract_text(BytesIO(response.content))
        except Exception as e:
            print(f"[Skipping PDF] Error extracting text from PDF at {url}: {e}", file=sys.stderr)
            return ""
    else:
        soup = BeautifulSoup(html, "html.parser")
        all_text = soup.get_text(separator=' ', strip=True)

    return all_text

def is_academic_url(url):
    academic_domains = [
        '.edu', '.gov', '.org', 
        'arxiv.org', 'researchgate.net', 'springer.com', 'ieeexplore.ieee.org',
        'journals.sagepub.com', 'nature.com', 'sciencedirect.com'
    ]
    return any(domain in url for domain in academic_domains)

# retry 3 times in case google blocks request
def safe_search(query, num_sites):
    retries = 3
    for attempt in range(retries):
        try:
            all_results = list(search(query, num=20, start=0, stop=20, pause=random.uniform(2, 4)))
            academic_results = [url for url in all_results if is_academic_url(url)]
            return academic_results[:num_sites]
        except Exception as e:
            print(f"[Attempt {attempt+1}/{retries}] Search failed: {e}", file=sys.stderr)
            wait_time = random.uniform(2, 5)
            print(f"Retrying after {wait_time:.2f} seconds...", file=sys.stderr)
            time.sleep(wait_time)
    raise Exception("Failed search after 3 retries.")

def search_web(query, num_sites=0):
    data = []   
    res = safe_search(query, num_sites)

    for url in res:
        text = scrape_website(url)
        if text.strip():
            data.append({ 'url' : url, 'text' : text })

    return data