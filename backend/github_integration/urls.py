from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.GitHubLoginView.as_view(), name='github_login'),
    path('callback/', views.GitHubCallbackView.as_view(), name='github_callback'),
]
