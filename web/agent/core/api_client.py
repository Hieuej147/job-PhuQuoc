import httpx
import logging
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)


class ApiClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or "http://localhost:3001/api/agent"
        self.timeout = 300
        self._auth_token: Optional[str] = None
        self._cookie: Optional[str] = None
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
        )

    def set_auth_token(self, token: Optional[str]):
        self._auth_token = token

    def set_cookie(self, cookie: Optional[str]):
        self._cookie = cookie

    def _get_headers(self, headers: Optional[Dict] = None) -> Dict:
        h = {"Content-Type": "application/json"}
        if self._cookie:
            h["Cookie"] = self._cookie
        elif self._auth_token:
            h["Authorization"] = self._auth_token
        if headers:
            h.update(headers)
        return h

    async def get(self, path: str, params: Optional[Dict] = None, headers: Optional[Dict] = None) -> Any:
        response = await self.client.get(path, params=params, headers=self._get_headers(headers))
        response.raise_for_status()
        return response.json()

    async def post(self, path: str, json: Optional[Dict] = None, headers: Optional[Dict] = None) -> Any:
        response = await self.client.post(path, json=json, headers=self._get_headers(headers))
        response.raise_for_status()
        return response.json()

    async def patch(self, path: str, json: Optional[Dict] = None, headers: Optional[Dict] = None) -> Any:
        response = await self.client.patch(path, json=json, headers=self._get_headers(headers))
        response.raise_for_status()
        return response.json()

    async def delete(self, path: str, headers: Optional[Dict] = None) -> Any:
        response = await self.client.delete(path, headers=self._get_headers(headers))
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self.client.aclose()
