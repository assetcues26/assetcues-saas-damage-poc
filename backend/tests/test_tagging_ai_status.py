"""Tests for Tagging AI pass/fail computation."""

from app.services.tagging_ai_client import apply_image_readability, compute_ai_status, resolve_image_readability


def test_repository_exports_apply_image_readability_import():
    """Regression: run_analysis crashed when this import was missing."""
    from app.services import saas_assets_repository

    assert saas_assets_repository.apply_image_readability is apply_image_readability


def _full_pass_response():
    return {
        "imageReadability": "Y",
        "namedescriptionmatch": "Y",
        "subcatmodelmatch": "Y",
        "detectedtagnumbermatch": "Y",
        "costvalidation": {"costmatch": "Y"},
        "acquisitiondatevalidation": {"datematch": "Y"},
    }


def test_compute_ai_status_pass():
    status, summary = compute_ai_status(_full_pass_response())
    assert status == "pass"
    assert all(summary["checks"].values())


def test_compute_ai_status_fail_on_subcat():
    data = _full_pass_response()
    data["subcatmodelmatch"] = "N"
    status, summary = compute_ai_status(data)
    assert status == "fail"
    assert summary["checks"]["subcatmodelmatch"] is False


def test_compute_ai_status_fail_on_tag():
    data = _full_pass_response()
    data["detectedtagnumbermatch"] = "N"
    status, _ = compute_ai_status(data)
    assert status == "fail"


def test_compute_ai_status_fail_on_cost():
    data = _full_pass_response()
    data["costvalidation"] = {"costmatch": "N"}
    status, _ = compute_ai_status(data)
    assert status == "fail"


def test_resolve_image_readability_two_images():
    assert resolve_image_readability(has_asset_image=True, has_barcode_image=True) == "Y"
    assert (
        resolve_image_readability(
            has_asset_image=True, has_barcode_image=True, ai_value="E"
        )
        == "Y"
    )


def test_resolve_image_readability_no_images():
    assert resolve_image_readability(has_asset_image=False, has_barcode_image=False) == "N"


def test_resolve_image_readability_single_image():
    assert resolve_image_readability(has_asset_image=True, has_barcode_image=False) == "Y"
    assert (
        resolve_image_readability(
            has_asset_image=True, has_barcode_image=False, ai_value="N"
        )
        == "N"
    )


def test_compute_ai_status_field_comparison():
    metadata = {
        "assetname": "Dell Laptop",
        "tagnumber": "TAG-1",
        "cost": "125000",
        "acquisitiondate": "15-08-2023",
        "subcategoryname": "Laptops",
        "makemodelname": "Latitude 5420",
    }
    data = _full_pass_response()
    data["subcatmodelmatch"] = "N"
    data["detectedAsset"] = "HP Laptop"
    data["detectedtagnumber"] = "TAG-2"
    status, summary = compute_ai_status(data, metadata)
    assert status == "fail"
    assert "field_comparison" in summary
    assert summary["field_comparison"]["namedescriptionmatch"]["registered"] == "Dell Laptop"
    assert summary["field_comparison"]["namedescriptionmatch"]["detected"] == "HP Laptop"
