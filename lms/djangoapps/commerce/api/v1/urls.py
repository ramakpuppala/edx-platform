from django.conf import settings
from django.conf.urls import patterns, url

from commerce.api.v1 import views

urlpatterns = patterns(
    '',
    url(r'^courses/$', views.CourseListView.as_view(), name='list'),
    url(r'^courses/{}/$'.format(settings.COURSE_ID_PATTERN), views.CourseRetrieveUpdateView.as_view(),
        name='retrieve_update'),
)
