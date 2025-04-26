from google import genai
from dotenv import load_dotenv
import os
load_dotenv()



def remove_first_and_last_lines(text):
    lines = text.splitlines()
    if len(lines) > 2:
        return '\n'.join(lines[1:-1])
    elif len(lines) == 2:
        return ''
    else:
        return ''

def generate_notes() :
    API_KEY = os.getenv('GEMINI_API_KEY')
    client = genai.Client(api_key=API_KEY)

    raw_transcript = client.files.upload(file='transcript.txt')

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

    initial_outline = client.models.generate_content(
        model="gemini-2.5-flash-preview-04-17", contents=["You are student taking notes for a lecture. Can you summarize this lecture transcript by key topics? Follow this format and keep the html tags: \n" + raw_outline_template, raw_transcript]
    )

    with open('outline.txt', 'w') as output:
        output.write(initial_outline.text)

    timestamped_transcript = client.files.upload(file="transcript.vtt")


    timestamped_outline = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are a transcriber that is trying to timestamp lecture notes. Can you timestamp each key topic from the initial outline file using the vtt file. Follow this format and keep the html tags: \n" 
                                            + timestamped_outline_template, 
                                            initial_outline, timestamped_transcript]
    )

    with open('time_stamped_outline.txt', 'w') as output:
        output.write(timestamped_outline.text)

    timestamped_notes = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are a student trying write detailed lecture notes. Can you fill in extremely detailed notes for each subheading using the lecture transcript as the source. Follow this format: \n:" 
                                            + timestamped_notes_template, 
                                            timestamped_outline, timestamped_transcript]
    )

    with open('time_stamped_notes.html', 'w') as output:
        output.write(timestamped_notes.text)
        
if __name__ == "__main__":
    generate_notes()
