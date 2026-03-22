from fastapi.testclient import TestClient
from main import app
import sys

client = TestClient(app)

def test_auth():
    try:
        print("--- Testing /auth/register ---")
        response = client.post(
            "/auth/register",
            json={"name": "Test User", "email": "test@example.com", "password": "password123"}
        )
        print("Status:", response.status_code)
        print("Response:", response.json())

        print("\n--- Testing /auth/login ---")
        response = client.post(
            "/auth/login",
            data={"username": "test@example.com", "password": "password123"}
        )
        print("Status:", response.status_code)
        print("Response:", response.json())
        
        print("\n--- Testing Profile /users/me ---")
        token = response.json().get("access_token")
        if token:
            res = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
            print("Status:", res.status_code)
            print("Response:", res.json())
            
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")

if __name__ == "__main__":
    test_auth()
