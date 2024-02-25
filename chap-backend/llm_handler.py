#python -m uvicorn llm_handler:app --reload
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
from openai import OpenAI
import ollama

class Item(BaseModel):
    service: str
    prompt: str
    data: str

app = FastAPI()

os.environ['OPENAI_API_KEY'] = ""  # Your OpenAI API key

@app.post("/")
async def api_endpoint(item: Item):
    message = item.prompt + " " + item.data
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