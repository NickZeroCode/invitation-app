from templates_app.models import InvitationTemplate

ENDPOINT = "/api/templates/"


def test_template_catalog_requires_authentication(api_client):
    response = api_client.get(ENDPOINT)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_seeded_catalog_lists_all_templates_with_capabilities(auth_client):
    response = auth_client.get(ENDPOINT)

    assert response.status_code == 200
    templates = response.json()
    keys = {item["key"] for item in templates}
    assert keys == {
        "heritage-luxe",
        "jardin-floral",
        "ligne-moderne",
        "confetti",
        "sceau-academique",
        "soiree-formelle",
        "memoire",
    }

    heritage = next(item for item in templates if item["key"] == "heritage-luxe")
    assert heritage["name"] == "Héritage"
    assert heritage["category"] == "wedding"
    assert heritage["category_label"] == "Mariage"
    assert heritage["supports_cover"] is True
    assert heritage["config"]["emphasis_fields"] == ["title", "date", "venue"]
    assert "cover" in heritage["config"]["sections"]

    moderne = next(item for item in templates if item["key"] == "ligne-moderne")
    assert moderne["supports_cover"] is False
    assert "cover" not in moderne["config"]["sections"]


def test_inactive_templates_are_hidden(auth_client):
    InvitationTemplate.objects.filter(key="confetti").update(is_active=False)

    response = auth_client.get(ENDPOINT)

    assert response.status_code == 200
    assert "confetti" not in {item["key"] for item in response.json()}


def test_template_retrieve_by_key(auth_client):
    response = auth_client.get(f"{ENDPOINT}heritage-luxe/")

    assert response.status_code == 200
    assert response.json()["key"] == "heritage-luxe"

    missing = auth_client.get(f"{ENDPOINT}modele-inconnu/")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "not_found"


def test_template_catalog_is_read_only(auth_client):
    response = auth_client.post(ENDPOINT, {}, format="json")

    assert response.status_code == 405
    assert response.json()["error"]["code"] == "method_not_allowed"
