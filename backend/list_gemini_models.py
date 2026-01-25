"""
Check available Gemini models
"""
import httpx
import asyncio
import os

async def list_models():
    # Get API key
    import importlib.util
    spec = importlib.util.spec_from_file_location("main", "main.py")
    if spec and spec.loader:
        main_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(main_module)
        api_key = getattr(main_module, 'GEMINI_API_KEY', '')
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
    
    if response.status_code == 200:
        result = response.json()
        print("Available Gemini models:")
        print("=" * 60)
        for model in result.get('models', []):
            name = model.get('name', '')
            display_name = model.get('displayName', '')
            supported = model.get('supportedGenerationMethods', [])
            
            if 'generateContent' in supported:
                print(f"✓ {name}")
                print(f"  Display: {display_name}")
                print()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

asyncio.run(list_models())