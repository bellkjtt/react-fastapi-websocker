from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import openai  # Assuming you're integrating GPT

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()  # Receive speech text from client
            print(f"Received speech: {data}")

            # Optionally: Process with GPT-3 or another AI service
            response = await process_with_gpt(data)

            # Send processed data back to client
            await websocket.send_text(f"GPT response: {response}")
        except Exception as e:
            print(f"Error: {e}")
            break

async def process_with_gpt(text: str) -> str:
    # Call GPT-3 API to get response
    openai.api_key = "your-api-key"
    response = openai.Completion.create(
        engine="text-davinci-003", prompt=text, max_tokens=100
    )
    return response.choices[0].text.strip()
