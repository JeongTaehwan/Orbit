"""
학습 기록(Record) 엔드포인트 통합 테스트.
"""


def _make_planet(client, difficulty="easy"):
    """테스트용 행성 하나 만들고 id 반환하는 헬퍼."""
    return client.post("/planets", json={"name": "P", "difficulty": difficulty}).json()["id"]


def test_create_record(client):
    planet_id = _make_planet(client)

    res = client.post(f"/planets/{planet_id}/records", json={"content": "오늘 학습함"})
    assert res.status_code == 201

    body = res.json()
    assert body["content"] == "오늘 학습함"
    assert body["planet_id"] == planet_id
    assert body["id"] > 0


def test_create_record_planet_not_found(client):
    res = client.post("/planets/999/records", json={"content": "x"})
    assert res.status_code == 404


def test_create_record_empty_content(client):
    planet_id = _make_planet(client)
    # content min_length=1 위반 → 422
    res = client.post(f"/planets/{planet_id}/records", json={"content": ""})
    assert res.status_code == 422


def test_list_records(client):
    planet_id = _make_planet(client)
    client.post(f"/planets/{planet_id}/records", json={"content": "1"})
    client.post(f"/planets/{planet_id}/records", json={"content": "2"})

    res = client.get(f"/planets/{planet_id}/records")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_list_records_planet_not_found(client):
    assert client.get("/planets/999/records").status_code == 404


def test_records_belong_to_correct_planet(client):
    p1 = _make_planet(client)
    p2 = _make_planet(client)
    client.post(f"/planets/{p1}/records", json={"content": "p1 기록"})

    # p2에는 기록이 없어야 함
    assert len(client.get(f"/planets/{p1}/records").json()) == 1
    assert len(client.get(f"/planets/{p2}/records").json()) == 0
