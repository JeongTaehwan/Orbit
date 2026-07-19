"""인증(로그인 필수 / 소유권) 관련 테스트."""


def test_me_requires_auth(anon_client):
    assert anon_client.get("/auth/me").status_code == 401


def test_planets_require_auth(anon_client):
    assert anon_client.get("/planets").status_code == 401
    assert (
        anon_client.post("/planets", json={"name": "x", "difficulty": "easy"}).status_code
        == 401
    )


def test_me_returns_current_user(client):
    res = client.get("/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "u1@example.com"


def test_logout_ok(client):
    assert client.post("/auth/logout").status_code == 200


def test_planets_isolated_per_user(client):
    # user1 로 행성 생성
    pid = client.post("/planets", json={"name": "내 행성", "difficulty": "easy"}).json()["id"]

    # user2 로 전환 → 남의 행성은 안 보이고 접근 시 404
    client.current["id"] = 2
    assert client.get("/planets").json() == []
    assert client.get(f"/planets/{pid}").status_code == 404
    assert client.delete(f"/planets/{pid}").status_code == 404
    assert (
        client.post(f"/planets/{pid}/records", json={"content": "x"}).status_code == 404
    )

    # 다시 user1 → 자기 행성은 정상
    client.current["id"] = 1
    assert client.get(f"/planets/{pid}").status_code == 200
