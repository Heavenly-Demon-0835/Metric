import urllib.request
import urllib.error
import json

data = json.dumps({
    "name": "Validation",
    "email": "validation_final100@example.com",
    "password": "securepassword",
    "age": 25,
    "height": 180,
    "weight": 75,
    "gender": "Male"
}).encode('utf-8')

req = urllib.request.Request(
    "http://127.0.0.1:8000/auth/register", 
    data=data, 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print("SUCCESS:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.reason)
    print("BODY:", e.read().decode())
except Exception as e:
    print("OTHER ERROR:", e)
