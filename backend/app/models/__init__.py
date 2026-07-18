"""
models 패키지.

여기서 모든 모델을 import 해두면
(1) `from app.models import Planet, Record` 로 편히 쓸 수 있고
(2) Base.metadata 가 모든 테이블을 인식한다(create_all 대상 등록).
"""

from app.models.planet import Planet
from app.models.record import Record

__all__ = ["Planet", "Record"]
