# utils/interview_agent.py

from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def interview_agent(session_id, message, system_prompt, session_store, model="gpt-4-turbo"):
    messages = [{"role": "system", "content": system_prompt}] + session_store.get(session_id, []) + [{"role": "user", "content": message}]
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.3,
        max_tokens=1024
    )
    
    reply = response.choices[0].message.content
    session_store.setdefault(session_id, []).extend([
        {"role": "user", "content": message},
        {"role": "assistant", "content": reply}
    ])
    
    return reply
