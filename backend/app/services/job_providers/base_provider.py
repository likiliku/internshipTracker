from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseJobProvider(ABC):
    @abstractmethod
    async def search_jobs(self, keyword: str = "", location: str = "", page: int = 1, results_per_page: int = 20) -> List[Dict[str, Any]]:
        pass
