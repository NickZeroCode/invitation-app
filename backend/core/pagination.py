from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Backend pagination for list endpoints (never fetch everything)."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
