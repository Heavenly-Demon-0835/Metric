import asyncio
import logging
import os

import httpx
from fastapi import APIRouter, Depends, Query

from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discovery", tags=["discovery"])

# USDA FoodData Central API Key
# Get a free key at: https://fdc.nal.usda.gov/api-key-signup.html
# Then set USDA_API_KEY in your .env file.
# The DEMO_KEY works but has aggressive rate limits (30 req/hour).
USDA_API_KEY = os.getenv("USDA_API_KEY", "DEMO_KEY")

USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
OFF_URL = "https://world.openfoodfacts.org/api/v2/search"
WGER_URL = "https://wger.de/api/v2/exercise/search/"


def _truncate(text: str, limit: int = 50) -> str:
    return text[:limit] + "..." if len(text) > limit else text


@router.get("/food")
async def search_food(q: str = Query(..., min_length=2), user=Depends(get_current_user)):
    # Search terms go through `params` so httpx escapes them; interpolating
    # them into the URL would let a query string smuggle in extra parameters.
    async with httpx.AsyncClient() as client:
        usda_task = client.get(
            USDA_URL,
            params={"api_key": USDA_API_KEY, "query": q},
            timeout=5.0,
        )
        off_task = client.get(
            OFF_URL,
            params={
                "search_terms": q,
                "fields": "id,product_name,brands,nutriments",
                "page_size": 10,
            },
            timeout=5.0,
        )

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
                        "name": _truncate(item.get("description", "").title()),
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
                            "name": _truncate(item.get("product_name", "Unknown Product").title()),
                            "brand": item.get("brands", "Open Food Facts"),
                            "calories_per_100g": round(nut.get("energy-kcal_100g", 0), 1),
                            "protein_per_100g": round(nut.get("proteins_100g", 0), 1),
                            "carbs_per_100g": round(nut.get("carbohydrates_100g", 0), 1),
                            "fat_per_100g": round(nut.get("fat_100g", 0), 1),
                            "source": "Open Food Facts"
                        })
        except Exception:
            logger.exception("Food discovery proxy failed for query %r", q)

        return results


@router.get("/exercise")
async def search_exercise(q: str = Query(..., min_length=2), user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(WGER_URL, params={"term": q}, timeout=5.0)
            if res.status_code != 200:
                return []
            data = res.json()
            results = []
            for idx, item in enumerate(data.get("suggestions", [])[:10]):
                value = item.get("value", "")
                data_obj = item.get("data", {})
                # Wger categories are usually strings in this endpoint response
                results.append({
                    "id": f"wger_{data_obj.get('id', idx)}",
                    "name": value if value else "Unknown Exercise",
                    "category": data_obj.get("category", "Exercise"),
                    "source": "Wger API",
                })
            return results
        except Exception:
            logger.exception("Exercise discovery proxy failed for query %r", q)
            return []
