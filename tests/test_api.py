from urllib.parse import quote


def test_get_activities_returns_dict_and_200(client):
    # Arrange
    # client fixture is ready

    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)


def test_signup_success_adds_participant(client):
    # Arrange
    activity = "Chess Club"
    email = "test_student@mergington.edu"
    url = f"/activities/{quote(activity)}/signup"

    # Act
    resp = client.post(url, params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")


def test_signup_duplicate_returns_400(client):
    # Arrange
    activity = "Programming Class"
    email = "repeat@mergington.edu"
    url = f"/activities/{quote(activity)}/signup"

    # Act
    first = client.post(url, params={"email": email})
    second = client.post(url, params={"email": email})

    # Assert
    assert first.status_code == 200
    assert second.status_code == 400


def test_signup_nonexistent_activity_returns_404(client):
    # Arrange
    activity = "No Such Club"
    email = "noone@mergington.edu"
    url = f"/activities/{quote(activity)}/signup"

    # Act
    resp = client.post(url, params={"email": email})

    # Assert
    assert resp.status_code == 404


def test_unregister_success_and_removes_participant(client):
    # Arrange
    activity = "Gym Class"
    email = "john@mergington.edu"  # existing participant in initial data
    del_url = f"/activities/{quote(activity)}/participants"

    # Act
    resp = client.delete(del_url, params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")


def test_unregister_nonexistent_participant_returns_404(client):
    # Arrange
    activity = "Chess Club"
    email = "not-registered@mergington.edu"
    del_url = f"/activities/{quote(activity)}/participants"

    # Act
    resp = client.delete(del_url, params={"email": email})

    # Assert
    assert resp.status_code == 404
