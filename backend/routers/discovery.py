import httpx
import asyncio
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user

router = APIRouter(prefix="/discovery", tags=["discovery"])

@router.get("/food")
async def search_food(q: str = Query(..., min_length=2), user=Depends(get_current_user)):
    # Run USDA and Open Food Facts in parallel
    async with httpx.AsyncClient() as client:
        usda_url = f"https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query={q}"
        off_url = f"https://world.openfoodfacts.org/api/v2/search?search_terms={q}&fields=id,product_name,brands,nutriments&page_size=10"
        
        usda_task = client.get(usda_url, timeout=5.0)
        off_task = client.get(off_url, timeout=5.0)
        
        results = []
        
        try:
            usda_res, off_res = await asyncio.gather(usda_task, off_task, return_exceptions=True)
            
            # Parse USDA
            if isinstance(usda_res, httpx.Response) and usda_res.status_code == 200:
                data = usda_res.json()
                for item in data.get("foods", [])[:5]:
                    macros = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
                    for n in item.get("foodNutrients", []):
                        name = n.get("nutrientName", "").lower()
                        val = n.get("value", 0)
                        if "energy" in name and "kcal" in n.get("unitName", "").lower(): macros["calories"] = val
                        elif "protein" in name: macros["protein"] = val
                        elif "carbohydrate" in name: macros["carbs"] = val
                        elif "lipid" in name or "fat" in name: macros["fat"] = val
                        
                    results.append({
                        "id": f"usda_{item.get('fdcId')}",
                        "name": item.get("description", "").title()[:50] + ("..." if len(item.get("description", "")) > 50 else ""),
                        "brand": item.get("brandOwner", "USDA (Raw)"),
                        "calories_per_100g": round(macros["calories"], 1),
                        "protein_per_100g": round(macros["protein"], 1),
                        "carbs_per_100g": round(macros["carbs"], 1),
                        "fat_per_100g": round(macros["fat"], 1),
                        "source": "USDA FoodData"
                    })
                    
            # Parse Open Food Facts
            if isinstance(off_res, httpx.Response) and off_res.status_code == 200:
                data = off_res.json()
                for item in data.get("products", [])[:5]:
                    nut = item.get("nutriments", {})
                    # Ensure it has basic calories info
                    if "energy-kcal_100g" in nut:
                        results.append({
                            "id": f"off_{item.get('id')}",
                            "name": item.get("product_name", "Unknown Product").title()[:50] + ("..." if len(item.get("product_name", "")) > 50 else ""),
                            "brand": item.get("brands", "Open Food Facts"),
                            "calories_per_100g": round(nut.get("energy-kcal_100g", 0), 1),
                            "protein_per_100g": round(nut.get("proteins_100g", 0), 1),
                            "carbs_per_100g": round(nut.get("carbohydrates_100g", 0), 1),
                            "fat_per_100g": round(nut.get("fat_100g", 0), 1),
                            "source": "Open Food Facts"
                        })
        except Exception as e:
            print(f"Discovery proxy error: {e}")
            
        return results

@router.get("/exercise")
async def search_exercise(q: str = Query(..., min_length=2), user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        # Wger API v2 search endpoint
        wger_url = f"https://wger.de/api/v2/exercise/search/?term={q}"
        try:
            res = await client.get(wger_url, timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                results = []
                for idx, item in enumerate(data.get("suggestions", [])[:10]):
                    value = item.get("value", "")
                    data_obj = item.get("data", {})
                    category = data_obj.get("category", "Exercise")
                    # Wger categories are usually strings in this endpoint response
                    results.append({
                        "id": f"wger_{data_obj.get('id', idx)}",
                        "name": value if value else "Unknown Exercise",
                        "category": category,
                        "source": "Wger API",
                    })
                return results
            return []
        except Exception as e:
            print(f"Wger discovery error: {e}")
            return []
