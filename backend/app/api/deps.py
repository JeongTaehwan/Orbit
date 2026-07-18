"""
엔드포인트 공통 의존성 모음.

지금은 get_db 하나뿐이지만, 인증이 들어오면 여기에
get_current_user 같은 의존성을 추가해 라우터들이 공유하게 된다.
"""

from app.core.database import get_db

__all__ = ["get_db"]
