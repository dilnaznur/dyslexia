"""
Quick diagnostic script - run this to find the problem
"""
import sys

print("=" * 60)
print("MindStep Gemini Endpoint Diagnostic")
print("=" * 60)

# Test 1: Check httpx
print("\n1. Checking httpx...")
try:
    import httpx
    print("   ✓ httpx is installed")
    print(f"   Version: {httpx.__version__}")
except ImportError as e:
    print(f"   ✗ httpx NOT installed: {e}")
    print("   Fix: pip install httpx")
    sys.exit(1)

# Test 2: Check environment variable
print("\n2. Checking GEMINI_API_KEY...")
import os
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    print(f"   ✓ Environment variable set")
    print(f"   Key starts with: {api_key[:10]}...")
else:
    print("   ✗ Environment variable NOT set")
    print("   Will use hardcoded value from main.py")

# Test 3: Check if we can import main.py
print("\n3. Checking main.py configuration...")
try:
    # Import GEMINI_API_KEY from main
    import importlib.util
    spec = importlib.util.spec_from_file_location("main", "main.py")
    if spec and spec.loader:
        main_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(main_module)
        
        key = getattr(main_module, 'GEMINI_API_KEY', None)
        if key and key != "PASTE_YOUR_KEY":
            print(f"   ✓ API key configured in main.py")
            print(f"   Key starts with: {key[:10]}...")
        else:
            print(f"   ✗ API key = '{key}'")
            print("   Fix: Set GEMINI_API_KEY in main.py or as environment variable")
            sys.exit(1)
except Exception as e:
    print(f"   ⚠️  Could not check main.py: {e}")

# Test 4: Test actual Gemini API call
print("\n4. Testing Gemini API connection...")
try:
    import asyncio
    
    async def test_gemini():
        # Use the key from main.py or environment
        if not api_key:
            spec = importlib.util.spec_from_file_location("main", "main.py")
            if spec and spec.loader:
                main_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(main_module)
                test_key = getattr(main_module, 'GEMINI_API_KEY', '')
        else:
            test_key = api_key
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={test_key}"
        
        body = {
            "contents": [{
                "parts": [{"text": "Say 'Hello' if you're working"}]
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=body, timeout=10.0)
            
        if response.status_code == 200:
            print("   ✓ Gemini API connection successful!")
            result = response.json()
            if 'candidates' in result:
                text = result['candidates'][0]['content']['parts'][0]['text']
                print(f"   Response: {text}")
            return True
        else:
            print(f"   ✗ API returned status {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    
    success = asyncio.run(test_gemini())
    
    if not success:
        print("\n⚠️  API connection failed - check your API key")
        print("Get a key from: https://aistudio.google.com/app/apikey")
        sys.exit(1)
        
except Exception as e:
    print(f"   ✗ Test failed: {e}")
    import traceback
    print(traceback.format_exc())
    sys.exit(1)

print("\n" + "=" * 60)
print("✓ All checks passed! Gemini endpoint should work.")
print("=" * 60)
print("\nIf you're still getting errors:")
print("1. Restart your FastAPI server")
print("2. Check the server logs for detailed error messages")
print("3. Try the debug endpoint from gemini_endpoint_debug.py")