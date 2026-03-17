from django.urls import path
from . import views

urlpatterns = [
    # OAuth
    path('login/', views.GitHubLoginView.as_view(), name='github_login'),
    path('callback/', views.GitHubCallbackView.as_view(), name='github_callback'),
    path('complete/', views.GitHubCompleteView.as_view(), name='github_complete'),
    # Repos
    path('repos/', views.RepoListView.as_view(), name='repo_list'),
    path('repos/<int:repo_id>/generate/', views.GenerateChallengesView.as_view(), name='generate_challenges'),
    # Challenges
    path('challenges/', views.ChallengeListView.as_view(), name='challenge_list'),
    path('challenges/<int:pk>/', views.ChallengeDetailView.as_view(), name='challenge_detail'),
    path('challenges/<int:pk>/submit/', views.ChallengeSubmitView.as_view(), name='challenge_submit'),
]
