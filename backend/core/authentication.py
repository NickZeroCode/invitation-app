"""Session authentication tuned to the SPA + API contract.

Two deviations from DRF's plain ``SessionAuthentication`` are required:

1. It never defines a ``WWW-Authenticate`` challenge, so DRF answers **403**
   to anonymous requests. The SPA contract requires **401** ("not
   authenticated" → redirect to login) distinct from 403 ("permission
   denied"). Defining ``authenticate_header`` fixes the status code.
2. DRF exempts API views from Django's CSRF middleware and only enforces CSRF
   inside ``SessionAuthentication`` when session credentials are present.
   Anonymous login POSTs would otherwise be CSRF-unprotected (login CSRF),
   so CSRF is enforced on every request handled by this class.

``enforce_csrf`` is a no-op for safe methods and for Django test client
requests with ``enforce_csrf_checks=False``.
"""
from rest_framework.authentication import SessionAuthentication


class SessionCookieAuthentication(SessionAuthentication):
    def authenticate_header(self, request):
        return "Session"

    def authenticate(self, request):
        self.enforce_csrf(request)
        return super().authenticate(request)
