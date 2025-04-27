from google import genai
from dotenv import load_dotenv
from webscraper import search_web
import os
import sys
load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')

def remove_first_and_last_lines(text):
    lines = text.splitlines()
    if len(lines) > 2:
        return '\n'.join(lines[1:-1])
    elif len(lines) == 2:
        return ''
    else:
        return ''

def generate_notes():
    client = genai.Client(api_key=API_KEY)

    raw_transcript = client.files.upload(file='./text_files/transcript.txt')

    raw_outline_template = """
    <h1>1. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1<h2>
        <h2>SUBJECT SUBHEADING 2<h2>
        <h2>SUBJECT SUBHEADING N<h2>
    
    <h1>2. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1<h2>
        <h2>SUBJECT SUBHEADING 2<h2>
        <h2>SUBJECT SUBHEADING N<h2>
    
    <h1>N. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1<h2>
        <h2>SUBJECT SUBHEADING 2<h2>
        <h2>SUBJECT SUBHEADING N<h2> 
    """
    
    timestamped_outline_template = """
    <h1>[hh:mm:ss] 1. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1<h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2<h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N<h2>

    <h1>[hh:mm:ss] 2. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1<h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2<h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N<h2>
    
    <h1>[hh:mm:ss] N. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1<h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2<h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N<h2>
    """

    timestamped_notes_template = """
    <h1>[hh:mm:ss] 1. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>

    <h1>[hh:mm:ss] 2. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
    
    <h1>[hh:mm:ss] N. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N<h2>
            <ul>
                <li><p>bullet 1</p></li>
                <li><p>bullet 2</p></li>
                <li><p>bullet N</p></li>
            </ul>
    """

    keyterms_template= """
        <h1>[hh:mm:ss] 1. SUBJECT MAIN HEADING<h1>   
        <h1>[hh:mm:ss] 2. SUBJECT MAIN HEADING<h1>   
        <h1>[hh:mm:ss] N. SUBJECT MAIN HEADING<h1>   
    """
    
    initial_outline = client.models.generate_content(
        model="gemini-2.5-flash-preview-04-17", contents=["You are student taking notes for a lecture. Can you summarize this lecture transcript by key topics? Follow this format and keep the html tags: \n" + raw_outline_template, raw_transcript]
    )
    
    print("Finished initial outline!", file=sys.stderr)

    with open('./text_files/outline.txt', 'w') as output:
        output.write(initial_outline.text)

    timestamped_transcript = client.files.upload(file="./text_files/transcript.vtt")


    timestamped_outline = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are a transcriber that is trying to timestamp lecture notes. Can you timestamp each key topic from the initial outline file using the vtt file. Follow this format and keep the html tags: \n" 
                                            + timestamped_outline_template, 
                                            initial_outline, timestamped_transcript]
    )

    print("Finished timestamped outline!", file=sys.stderr)

    with open('./text_files/time_stamped_outline.txt', 'w') as output:
        output.write(timestamped_outline.text)

    timestamped_notes = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are a student trying write detailed lecture notes. Can you fill in extremely detailed notes for each subheading using the lecture transcript. Follow this format: \n:" 
                                            + timestamped_notes_template, 
                                            timestamped_outline, timestamped_transcript]
    )

    print("Finished timestamped notes!", file=sys.stderr)

    with open('./text_files/time_stamped_notes.txt', 'w') as output:
        output.write(timestamped_notes.text)
    
    # with open('./text_files/time_stamped_notes.html', 'w') as output:
    #     output.write(timestamped_notes.text)
    
    # enhancing our notes using external sources
    keyterms = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are student trying to review key topics from lecture. Can you extract the SUBJECT MAIN HEADING without numbers from this format: \n:" 
                                            + keyterms_template, 
                                            timestamped_notes]
    )

    print("Finished keyterm extraction!", file=sys.stderr)

    with open('./text_files/key_terms.txt', 'w') as output:
        output.write(keyterms.text)
    
    keyterms.split()
    
    

if __name__ == "__main__":
    generate_notes()
