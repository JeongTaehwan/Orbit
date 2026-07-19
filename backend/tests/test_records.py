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
    body = res.json()
    assert len(body) == 2
    # 목록은 전문(content) 대신 미리보기(preview)만 내려준다
    assert "content" not in body[0]
    assert "preview" in body[0]


def test_list_records_returns_plain_text_preview(client):
    """마크다운 문법은 제거하고 첫 의미 있는 줄만 미리보기로 준다."""
    planet_id = _make_planet(client)
    markdown = "# 제목\n\n**굵은** 본문과 [링크](http://x)와 `코드`."
    client.post(f"/planets/{planet_id}/records", json={"content": markdown})

    preview = client.get(f"/planets/{planet_id}/records").json()[0]["preview"]
    assert preview == "제목"  # 첫 줄(제목)에서 # 제거


def test_get_record_returns_full_markdown(client):
    planet_id = _make_planet(client)
    markdown = "# 제목\n\n본문 마크다운"
    rec_id = client.post(
        f"/planets/{planet_id}/records", json={"content": markdown}
    ).json()["id"]

    res = client.get(f"/planets/{planet_id}/records/{rec_id}")
    assert res.status_code == 200
    assert res.json()["content"] == markdown  # 전문 그대로


def test_get_record_not_found(client):
    planet_id = _make_planet(client)
    assert client.get(f"/planets/{planet_id}/records/999").status_code == 404


def test_get_record_wrong_planet(client):
    """다른 행성의 기록 id 로는 조회되지 않는다."""
    p1 = _make_planet(client)
    p2 = _make_planet(client)
    rec_id = client.post(f"/planets/{p1}/records", json={"content": "x"}).json()["id"]
    assert client.get(f"/planets/{p2}/records/{rec_id}").status_code == 404


def test_delete_record(client):
    planet_id = _make_planet(client)
    rec_id = client.post(
        f"/planets/{planet_id}/records", json={"content": "지울 기록"}
    ).json()["id"]

    assert client.delete(f"/planets/{planet_id}/records/{rec_id}").status_code == 204
    assert len(client.get(f"/planets/{planet_id}/records").json()) == 0
    assert client.get(f"/planets/{planet_id}/records/{rec_id}").status_code == 404


def test_delete_record_not_found(client):
    planet_id = _make_planet(client)
    assert client.delete(f"/planets/{planet_id}/records/999").status_code == 404


def test_list_records_planet_not_found(client):
    assert client.get("/planets/999/records").status_code == 404


def test_records_belong_to_correct_planet(client):
    p1 = _make_planet(client)
    p2 = _make_planet(client)
    client.post(f"/planets/{p1}/records", json={"content": "p1 기록"})

    # p2에는 기록이 없어야 함
    assert len(client.get(f"/planets/{p1}/records").json()) == 1
    assert len(client.get(f"/planets/{p2}/records").json()) == 0
