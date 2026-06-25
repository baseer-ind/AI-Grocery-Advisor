from pydantic import BaseModel


class HouseholdProfileIn(BaseModel):
    size: int
    adults: int
    children: int = 0
    seniors: int = 0
    city: str
    monthly_grocery_budget: float | None = None


class HouseholdProfileOut(BaseModel):
    household_id: int
    size: int
    adults: int
    children: int
    seniors: int
    city: str
    monthly_grocery_budget: float | None
    insight: str


class ShoppingBehaviorIn(BaseModel):
    stores: list[str]
    frequency: str


class ShoppingBehaviorOut(BaseModel):
    household_id: int
    stores: list[str]
    frequency: str
    insight: str


class ShoppingStyleIn(BaseModel):
    priorities: list[str]


class ShoppingStyleOut(BaseModel):
    household_id: int
    priorities: list[str]
    insight: str
