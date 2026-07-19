"""
행성(Planet) 엔드포인트 통합 테스트.

client fixture(conftest.py)를 인자로 받으면 pytest가 자동 주입한다.
각 테스트는 깨끗한 빈 DB에서 시작한다.
"""


def test_create_planet(client):
    res = client.post("/planets", json={"name": "파이썬 기초", "difficulty": "easy"})
    assert res.status_code == 201

    body = res.json()
    assert body["name"] == "파이썬 기초"
    assert body["difficulty"] == "easy"
    assert body["id"] > 0
    assert body["record_count"] == 0
    assert body["progress"] == 0        # 기록 없으니 0%
    assert body["is_completed"] is False
    assert "created_at" in body          # 서버가 자동으로 채움


def test_create_planet_invalid_difficulty(client):
    # Enum에 없는 값 → Pydantic이 422로 거부
    res = client.post("/planets", json={"name": "x", "difficulty": "extreme"})
    assert res.status_code == 422


def test_create_planet_empty_name(client):
    # name min_length=1 위반 → 422
    res = client.post("/planets", json={"name": "", "difficulty": "easy"})
    assert res.status_code == 422


def test_list_planets(client):
    client.post("/planets", json={"name": "A", "difficulty": "easy"})
    client.post("/planets", json={"name": "B", "difficulty": "hard"})

    res = client.get("/planets")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_get_planet_detail(client):
    created = client.post("/planets", json={"name": "선형대수", "difficulty": "normal"}).json()

    res = client.get(f"/planets/{created['id']}")
    assert res.status_code == 200
    assert res.json()["name"] == "선형대수"


def test_get_planet_not_found(client):
    res = client.get("/planets/999")
    assert res.status_code == 404
    assert res.json()["detail"] == "행성을 찾을 수 없습니다."


def test_progress_updates_with_records(client):
    planet_id = client.post("/planets", json={"name": "P", "difficulty": "easy"}).json()["id"]

    # easy는 5개 필요. 기록 2개 추가 → 40%
    for i in range(2):
        client.post(f"/planets/{planet_id}/records", json={"content": f"기록{i}"})

    body = client.get(f"/planets/{planet_id}").json()
    assert body["record_count"] == 2
    assert body["progress"] == 40.0
    assert body["is_completed"] is False

    # 3개 더 → 총 5개 → 100% 완료
    for i in range(3):
        client.post(f"/planets/{planet_id}/records", json={"content": f"추가{i}"})

    body = client.get(f"/planets/{planet_id}").json()
    assert body["progress"] == 100.0
    assert body["is_completed"] is True


def test_delete_planet(client):
    planet_id = client.post("/planets", json={"name": "삭제대상", "difficulty": "easy"}).json()["id"]

    res = client.delete(f"/planets/{planet_id}")
    assert res.status_code == 204

    # 삭제 후 조회하면 404
    assert client.get(f"/planets/{planet_id}").status_code == 404


def test_delete_planet_not_found(client):
    assert client.delete("/planets/999").status_code == 404


def test_delete_cascades_records(client):
    planet_id = client.post("/planets", json={"name": "P", "difficulty": "easy"}).json()["id"]
    client.post(f"/planets/{planet_id}/records", json={"content": "기록"})

    client.delete(f"/planets/{planet_id}")

    # 행성이 사라졌으니 그 기록 목록 조회도 404 (부모가 없음)
    assert client.get(f"/planets/{planet_id}/records").status_code == 404
