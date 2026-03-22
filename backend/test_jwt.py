import asyncio
import sys
from auth import create_access_token, verify_password, get_password_hash, SECRET_KEY, ALGORITHM
import jwt

async def main():
    try:
        print("--- Testing Password Hashing ---")
        pwd = "my_secret_password"
        hashed = get_password_hash(pwd)
        print(f"Hashed: {hashed}")
        is_valid = verify_password(pwd, hashed)
        print(f"Password Verify: {is_valid}")
        assert is_valid == True, "Password verification failed"

        print("\n--- Testing JWT Token Creation ---")
        token = create_access_token({"sub": "507f1f77bcf86cd799439011"})
        print(f"Token: {token}")
        
        print("\n--- Testing JWT Token Decoding ---")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded Payload: {payload}")
        assert payload["sub"] == "507f1f77bcf86cd799439011", "Token sub mismatch"
        print("\n✅ JWT Logic works perfectly.")
    except Exception as e:
        print(f"\n❌ Error encountered: {e}")

if __name__ == "__main__":
    asyncio.run(main())
