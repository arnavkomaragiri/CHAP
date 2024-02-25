#python -m uvicorn llm_handler:app --reload
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from openai import OpenAI
import ollama
from chap_backend.anon import init_mask_pipeline, anonymize
from chap_backend.memory import *
from chap_backend.prompts import *
import time

class Item(BaseModel):
    service: str
    prompt: str
    data: str

app = FastAPI()

# It's important to remove the trailing slashes from the origins for exact matching
origins = [
    "http://localhost:8000",  # Assuming this is the origin you are testing with; adjust if necessary
    "chrome-extension://lfliigiicobkaanpblaachbkeeikbcof",  # Your Chrome extension's ID
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specifies which origins are allowed
    allow_credentials=True,
    allow_methods=["POST"],  # Allow POST requests
    allow_headers=["Content-Type"],  # Allow Content-Type header
)

os.environ['OPENAI_API_KEY'] = ""  # Your OpenAI API key

@app.post("/")
async def api_endpoint(item: Item):
    conn = connect(os.getenv('POSTGRES_CONNECTION_STR'))
    clear_chunks(conn)
    # anon_data = anonymize(pipe, item.data, scrub_pii=True, p_mask=p_mask)
    conv_id = load_page(conn, item.data, TEXT_TYPE.PDF, anon_text=True)
    time.sleep(2)
    print("ABOUT TO SEARCH")
    results = vector_search(conn, item.prompt, k=num_retrieved)
    cur = conn.cursor()
    res = query(cur, "SELECT * FROM vectorize.search(job_name => 'chunk_search', query => 'What graduate degrees are available in ACCEND?', return_columns => ARRAY['conv_id', 'chunk_id', 'doc'], num_results => 3);")
    print(res)
    print("SEARCHED", results)
    context = ""
    for i, r in enumerate(results):
        context += f"Document {i + 1}: {r['doc']}\n"
    
    message = system_prompt + " Please answer the user question using only the given context.\nContext:\n" + context + f"User Question: {item.prompt}"
    print(message)
    if item.service == 'openai':
        print("openai picked")
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}]
        )
        return {'response' : response.choices[0].message.content}


    elif item.service == 'ollama':
        print("ollama picked")
        response = ollama.chat(model='llama2', messages=[
            {
                'role': 'user',
                'content': message,
            },
        ])
        return {'response' : response['message']['content']}


    elif item.service == 'aws':
        print("aws picked")
        url = 'https://ldqnetwom0.execute-api.us-east-1.amazonaws.com/llm-test/llm'
        params = {'question': message}
        response = requests.get(url, params=params)
        return {'response' : response.json()[0]["generated_text"]}
    else:
        raise HTTPException(status_code=400, detail="Invalid service")