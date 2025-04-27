from google import genai
from dotenv import load_dotenv
from webscraper import search_web
import os
import sys
load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')
NUM_RESULTS = 3
client = genai.Client(api_key=API_KEY)

def chunk_combined_text(text, max_chars=500000):  # 1 token ≈ 3-4 chars usually
    return [text[i:i+max_chars] for i in range(0, len(text), max_chars)]

keyterms_template= """
    <h1>1. SUBJECT MAIN HEADING<h1>   
    <h1>2. SUBJECT MAIN HEADING<h1>   
    <h1>N. SUBJECT MAIN HEADING<h1>   
"""

timestamped_notes = client.files.upload(file="./text_files/key_terms.txt")

keyterms_response = client.models.generate_content(
    model="gemini-2.0-flash", contents=["You are student trying to review key topics from lecture. Can you extract only the SUBJECT MAIN HEADING without any addtional characters from this format: \n:" 
                                        + keyterms_template + " Filter out course logistics and administration.",
                                        timestamped_notes]
)

print("Finished keyterm extraction!", file=sys.stderr)

with open('./text_files/key_terms.txt', 'w') as output:
    output.write(keyterms_response.text)   

keyterms = keyterms_response.text.split('\n')

for i, term in enumerate(keyterms):
    # skips empty newlines which sometimes happens
    if not term:
        continue
    
    search_result = search_web(term, NUM_RESULTS)
    combined_text_data = ""
    for result in search_result:
        print("SCANNING URL: ", result['url'], file=sys.stderr)
        combined_text_data += result['url'] + ": " + result['text'] + "\n"

    chunks = chunk_combined_text(combined_text_data)
    summaries = []
    # print(combined_text_data)

    for chunk in chunks:
        initial_prompt = f"""
        You are an academic smart study assistant helping a student summarize lecture material.

        Topic: '{term}'

        TASK:
        - Read through the grouped texts
        - For each important fact add the source url to href.
        - Prefer concise, clear notes.
        - Ignore repeated, irrelevant, or off-topic content.
        - Be sure to follow the output format EXACTLY.

        Input format:
        URL: Text

        Output format:
        <h1>{term}<h1>
            <h2>SUBJECT SUBHEADING 1<h2>
                <ul>
                    <li><a href=URL >bullet 1</a></li>
                    <li><a href=URL >bullet 2</a></li>
                    <li><a href=URL >bullet N</a></li>
                </ul>
            <h2>SUBJECT SUBHEADING 2<h2>
                <ul>
                    <li><a href=URL >bullet 1</a></li>
                    <li><a href=URL >bullet 2</a></li>
                    <li><a href=URL >bullet N</a></li>
                </ul>
            <h2>SUBJECT SUBHEADING N<h2>
                <ul>
                    <li><a href=URL >bullet 1</a></li>
                    <li><a href=URL >bullet 2</a></li>
                    <li><a href=URL >bullet N</a></li>
                </ul>

        Here is the data grouped by source: {chunk}
        """

        chunk_summary_response = client.models.generate_content(
            model="gemini-2.0-flash", contents=[initial_prompt]
        )
        
        summaries.append(chunk_summary_response.text)

    # print(summaries)
    combined_summary = "\n".join(summaries)

    final_prompt = f"""
    You are an academic smart study assistant.

    TASK:
    - Combine the following multiple summarized notes into one clean, organized, and complete final set of notes.
    - Eliminate duplicate points across different sources.
    - Group related ideas under common <h2> subheadings whenever possible.
    - Make sure each bullet point retains its correct <a href=URL>source</a>.
    - Prefer concise and clear phrasing for bullet points.
    - Follow this output format EXACTLY:

    Output Format:
    <h1>{i + 1} {term}</h1>
        <h2>SUBJECT SUBHEADING 1</h2>
            <ul>
                <li><a href=URL>bullet 1</a></li>
                <li><a href=URL>bullet 2</a></li>
                <li><a href=URL>bullet N</a></li>
            </ul>
        <h2>SUBJECT SUBHEADING 2</h2>
            <ul>
                <li><a href=URL>bullet 1</a></li>
                <li><a href=URL>bullet 2</a></li>
                <li><a href=URL>bullet N</a></li>
            </ul>
        <h2>SUBJECT SUBHEADING N</h2>
            <ul>
                <li><a href=URL>bullet 1</a></li>
                <li><a href=URL>bullet 2</a></li>
                <li><a href=URL>bullet N</a></li>
            </ul>

    Here are the multiple partial notes to combine:
    {combined_summary}
    """

    print(final_prompt)
    
    combined_notes_response = client.models.generate_content(
        model="gemini-2.0-flash", contents=[final_prompt]
    )
    
    # if its the first term written overwrite the file, else append to the file
    if i == 0: 
        with open(f'./text_files/web_notes.txt', 'w') as output:
            output.write(combined_notes_response.text)   
            output.write("\n")
    else:
        with open(f'./text_files/web_notes.txt', 'a') as output:
            output.write(combined_notes_response.text)   
            output.write("\n")
