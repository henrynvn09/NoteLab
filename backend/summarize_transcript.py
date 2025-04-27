from google import genai
from dotenv import load_dotenv
from webscraper import search_web, google_image_search
import os
import sys
load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')
NUM_RESULTS = 3

def remove_first_and_last_lines(text):
    lines = text.splitlines()
    if len(lines) > 2:
        return '\n'.join(lines[1:-1])
    elif len(lines) == 2:
        return ''
    else:
        return ''

def generate_notes(user_notes_path, text_file_path, vtt_file_path):
    client = genai.Client(api_key=API_KEY)

    raw_transcript = client.files.upload(file=text_file_path)

    raw_outline_template = """
    <h1>1. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1</h2>
        <h2>SUBJECT SUBHEADING 2</h2>
        <h2>SUBJECT SUBHEADING N</h2>
    
    <h1>2. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1</h2>
        <h2>SUBJECT SUBHEADING 2</h2>
        <h2>SUBJECT SUBHEADING N</h2>
    
    <h1>N. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1</h2>
        <h2>SUBJECT SUBHEADING 2</h2>
        <h2>SUBJECT SUBHEADING N</h2> 
    """
    
    timestamped_outline_template = """
    <h1>[hh:mm:ss] 1. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1</h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2</h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N</h2>

    <h1>[hh:mm:ss] 2. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1</h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2</h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N</h2>
    
    <h1>[hh:mm:ss] N. SUBJECT MAIN HEADING<h1>   
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 1</h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING 2</h2>
        <h2>[hh:mm:ss] SUBJECT SUBHEADING N</h2>
    """

    timestamped_notes_prompt = """
    You are a student writing extremely detailed lecture notes.

    TASK:
    - Carefully read the provided lecture transcript.
    - Expand the existing notes with *additional* detailed points if the transcript mentions new information.
    - Always preserve the original user notes — do NOT remove, reword, or replace them.
    - Insert new points as additional bullet points (<li>) under the correct <h2> subheading.
    - If a new idea from the transcript fits none of the existing subheadings, skip it. (DO NOT create new subheadings unless explicitly told.)
    - Maintain the professor's natural tone — notes should sound academic and precise.
    - Start every bullet point with a timestamp [hh:mm:ss].
    - Follow the output format EXACTLY:

    <h1> Heading </h1>
        <h2> Subheading </h2>
            <ul>
                <li>[hh:mm:ss] existing bullet 1</li>
                <li>[hh:mm:ss] existing bullet 2</li>
                <li>[hh:mm:ss] new detailed bullet from transcript</li>
                <li>[hh:mm:ss] new detailed bullet from transcript</li>
            </ul>

    Important:
    - Do NOT remove or change any original bullet points.
    - Add new bullets only if they add meaningful detail based on the transcript.
    - Stay realistic and academic — this should feel like well-organized real student notes.

    Input:
    - (1) A timestamped outline with user notes.
    - (2) A full lecture transcript.

    Your goal is to add additional detailed notes intelligently into the existing structure.
    """
    
    user_note_prompt = """
        You are a student organizing lecture notes.

        TASK:
        - Use the given outline headings (h1) and subheadings (h2) to organize the user notes.
        - Keep all the original content from the user notes — do not remove, shorten, or paraphrase important points.
        - For each h1 and h2 heading from the outline, place the related user notes underneath as bullet points.
        - If a note does not fit any heading exactly, place it under the most relevant heading.
        - Maintain the student's original realistic tone — the notes should sound human and natural.
        - Keep all timestamps [hh:mm:ss] at the start of each bullet point.
        - Only modify the structure (organization), not the content.
        - Follow this output format exactly:

        <h1>[hh:mm:ss] 1. SUBJECT MAIN HEADING </h1>
            <h2>[hh:mm:ss] SUBJECT SUBHEADING 1</h2>
                <ul>
                    <li>[hh:mm:ss] point from user notes</li>
                    <li>[hh:mm:ss] point from user notes</li>
                </ul>
            <h2>[hh:mm:ss] SUBJECT SUBHEADING 2</h2>
                <ul>
                    <li>[hh:mm:ss] point from user notes</li>
                </ul>

        <h1>[hh:mm:ss] 2. SUBJECT MAIN HEADING</h1>
            ...

        Input:
        - Outline with 5 h1 headings.
        - Full detailed user notes with timestamps.

        Your goal is to smartly merge them together while preserving everything important.    
    """
    
    initial_outline = client.models.generate_content(
        model="gemini-2.5-flash-preview-04-17", contents=["You are student taking notes for a lecture. Can you summarize this lecture transcript by key topics? Limit it to 5 h1 headers and follow this format EXACTLY: \n" + raw_outline_template, raw_transcript]
    )
    
    print("Finished initial outline!", file=sys.stderr)

    with open('./text_files/outline.txt', 'w') as output:
        output.write(initial_outline.text)

    timestamped_transcript = client.files.upload(file=vtt_file_path)

    timestamped_outline = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are a transcriber that is trying to timestamp lecture notes. Can you timestamp each key topic from the initial outline file using the vtt file. Follow this format and keep the html tags: \n" 
                                            + timestamped_outline_template, 
                                            initial_outline, timestamped_transcript]
    )

    print("Finished timestamped outline!", file=sys.stderr)

    with open('./text_files/time_stamped_outline.txt', 'w') as output:
        output.write(timestamped_outline.text)

    user_notes = client.files.upload(file=user_notes_path)
        
    user_notes_outline_response = client.models.generate_content(
        model="gemini-2.0-flash", contents=[user_note_prompt, user_notes]
    )
    
    with open('./text_files/templated_user_notes.txt', 'w') as output:
        output.write(user_notes_outline_response.text)    

    print("Finished formatting user notes!", file=sys.stderr)

    timestamped_notes = client.models.generate_content(
        model="gemini-2.0-flash", contents=[timestamped_notes_prompt, timestamped_transcript]
    )

    print("Finished timestamped notes!", file=sys.stderr)

    with open('./text_files/time_stamped_notes.txt', 'w') as output:
        output.write(timestamped_notes.text)
    
    def chunk_combined_text(text, max_chars=500000):  # 1 token ≈ 3-4 chars usually
        return [text[i:i+max_chars] for i in range(0, len(text), max_chars)]

    key_heading_template = """
        <h1>1. SUBJECT MAIN HEADING</h1>   
        <h1>2. SUBJECT MAIN HEADING</h1>   
        <h1>N. SUBJECT MAIN HEADING</h1>   
    """

    key_subheading_template = """
        <h1>1. SUBJECT MAIN HEADING<h1>   
        <h2>SUBJECT SUBHEADING 1</h2>
        <h2>SUBJECT SUBHEADING 2</h2>
        <h2>SUBJECT SUBHEADING N</h2>
    """

    timestamped_notes = client.files.upload(file="./text_files/time_stamped_notes.txt")

    key_headings_response = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are student trying to review key topics from lecture. Can you extract only the SUBJECT MAIN HEADING without any addtional characters or numbers from this format: \n:" 
                                            + key_heading_template + " Filter out anything non-academic like course logistics, administration or overview.",
                                            timestamped_notes]
    )

    key_subheadings_response = client.models.generate_content(
        model="gemini-2.0-flash", contents=["You are student trying to review key topics from lecture. Can you extract only the SUBJECT SUBHEADING without any addtional characters or numbers from this format: \n:" 
                                            + key_subheading_template + " Filter out anything non-academic like course logistics, administration or overview.",
                                            timestamped_notes]
    )

    print("Finished key topic extraction!", file=sys.stderr)

    with open('./text_files/key_headings.txt', 'w') as output:
        output.write(key_headings_response.text)   

    with open('./text_files/key_subheadings.txt', 'w') as output:
        output.write(key_subheadings_response.text)   

    key_headings = key_headings_response.text.split('\n')
    key_subheadings = key_subheadings_response.text.split('\n')
    # print(key_subheadings)

    # searches the web for relevant websites to add info
    for i, term in enumerate(key_headings):
        # skips empty newlines which sometimes happens
        if not term:
            continue
        
        search_result = search_web(term, NUM_RESULTS)
        combined_text_data = ""
        for result in search_result:
            print("SCANNING URL: ", result['url'], file=sys.stderr)
            combined_text_data += result['url'] + ": " + result['text'] + "\n"

        # chunk the input file to prevent sending too many tokens
        chunks = chunk_combined_text(combined_text_data)
        summaries = []
        # print(combined_text_data)
        

        for idx, chunk in enumerate(chunks):
            
            initial_prompt = f"""
            You are an academic smart study researcher.

            Topic: '{term}'

            TASK:
            - Read through the grouped texts.
            - For each important fact, add the source URL to the href.
            - Prefer concise, clear notes.
            - Ignore repeated, irrelevant, or off-topic content.
            - Make sure to preserve the original notes. 
            - If there are any new points in the grouped texts that are not already covered in the original notes, add them under the appropriate <h2> subheadings.
            - Group related ideas under the current <h2> subheadings.
            - Follow the output format EXACTLY.

            Input format:
            URL: Text

            Output format:
                <h1>
                    {idx + 1}. {term}
                    <a href="URL">
                        [Source 1]
                    </a>
                    <a href="URL">
                        [Source 2]
                    </a>
                    <a href="URL">
                        [Source N]
                    </a>
                </h1>
                <h2>SUBJECT SUBHEADING 1</h2>
                    <ul>
                        <li>bullet 1</li>
                        <li>bullet 2</li>
                        <li>bullet N</li>
                    </ul>
                <h2>SUBJECT SUBHEADING 2</h2>
                    <ul>
                        <li>bullet 1</li>
                        <li>bullet 2</li>
                        <li>bullet N</li>
                    </ul>
                <h2>SUBJECT SUBHEADING N</h2>
                    <ul>
                        <li>bullet 1</li>
                        <li>bullet 2</li>
                        <li>bullet N</li>
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
        You are an academic smart study researcher.

        TASK:
        - Combine the following multiple summarized notes into one clean, organized, and complete final set of notes.
        - Make sure to preserve all the original points in the notes.
        - If there are any new points in the website summaries that are not already covered in the original notes, add them under the appropriate <h2> subheadings.
        - Group related ideas under the current <h2> subheadings.
        - Remove any duplicate or repeated points while combining the summaries.
        - Make sure the sources are ONLY listed in the h1 headers.
        - Prefer concise and clear phrasing for bullet points.
        - Follow this output format EXACTLY:

        Output Format:
            <h1>
                {i + 1}. {term}
                <a href="URL">
                    [Source 1]
                </a>
                <a href="URL">
                    [Source 2]
                </a>
                <a href="URL">
                    [Source N]
                </a>
            </h1>
            <h2>SUBJECT SUBHEADING 1</h2>
                <ul>
                    <li>bullet 1</li>
                    <li>bullet 2</li>
                    <li>bullet N</li>
                </ul>
            <h2>SUBJECT SUBHEADING 2</h2>
                <ul>
                    <li>bullet 1</li>
                    <li>bullet 2</li>
                    <li>bullet N</li>
                </ul>
            <h2>SUBJECT SUBHEADING N</h2>
                <ul>
                    <li>bullet 1</li>
                    <li>bullet 2</li>
                    <li>bullet N</li>
                </ul>

        Here are the multiple partial notes to combine:
        {combined_summary}
        """
        # print(final_prompt)
        
        combined_notes_response = client.models.generate_content(
            model="gemini-2.0-flash", contents=[final_prompt, timestamped_notes]
        )

        print(f"Finished term: {i + 1}", file=sys.stderr)
        # if its the first term written overwrite the file, else append to the file
        if i == 0:    
            with open(f'./text_files/web_notes.txt', 'w') as output:
                output.write(combined_notes_response.text)   
                output.write("\n")
        else:       
            with open(f'./text_files/web_notes.txt', 'a') as output:
                output.write(combined_notes_response.text)   
                output.write("\n")
    
    # google image searches to get relevant images for all subheadings
    subheading_image_pairs = []

    for i, subheading in enumerate(key_subheadings):
        image_url = google_image_search(subheading)
        subheading_image_pairs.append({
            "subheading": subheading,
            "image_url": image_url
        })
        
    image_prompt = f"""
    You are a skilled web content enhancer specialized in educational and academic materials.

    TASK:
    - For each <h2> subheading and its corresponding image_url (already provided):
        - Check if the image meaningfully matches the topic of the subheading.
        - Only insert the image if it clearly and logically represents the subheading's concept.
        - If the image is relevant, insert it immediately after the <h2> tag using an <img src="URL", width="675"> tag.
        - If the image is not relevant, skip inserting anything for that subheading.
    - Keep the rest of the HTML content exactly as it is — only insert images where appropriate.
    - Insert at most ONE image per subheading.
    - Preserve the original structure, formatting, and indentation of the HTML.

    Output Format:
        <h2>SUBJECT SUBHEADING 1</h2>
        <img src="URL", width="675">
        <ul>
            <li>bullet 1</li>
            <li>bullet 2</li>
            <li>bullet N</li>
        </ul>
        
        <h2>SUBJECT SUBHEADING 2</h2>
        <img src="URL", width="675">
        <ul>
            <li>bullet 1</li>
            <li>bullet 2</li>
            <li>bullet N</li>
        </ul>
        
        <h2>SUBJECT SUBHEADING N</h2>
        <img src="URL", width="675">
        <ul>
            <li>bullet 1</li>
            <li>bullet 2</li>
            <li>bullet N</li>
        </ul>

    Here are the subheadings and associated image URLs:
    {subheading_image_pairs}
    """

    image_response = combined_notes_response = client.models.generate_content(
            model="gemini-2.0-flash", contents=[image_prompt, timestamped_notes]
        )

    print("Finished fetching images!", file=sys.stderr)
    final_notes_with_images = image_response.text

    #remove the boilerplate html tag from file
    remove_first_and_last_lines(final_notes_with_images)
    # save the final result as html file    
    with open(f'./text_files/final_notes_with_images.html', 'w') as output:
        output.write(final_notes_with_images)
    
    print("Successfully completed notes!", file=sys.stderr)

# if __name__ == '__main__':
#     generate_notes('./text_files/user_notes.html', './text_files/transcript2.txt', './text_files/transcript2.vtt')