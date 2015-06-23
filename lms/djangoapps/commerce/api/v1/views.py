import logging

from django.core.exceptions import ValidationError

from django.http import Http404
from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, ListAPIView
from rest_framework.response import Response

from commerce.api.v1.models import Course

from commerce.api.v1.serializers import CourseSerializer

log = logging.getLogger(__name__)


class CourseListView(ListAPIView):
    """ List courses and modes. """
    serializer_class = CourseSerializer
    queryset = Course.all()


class CourseRetrieveUpdateView(RetrieveUpdateAPIView):
    """ Retrieve, update, or create courses/modes. """
    lookup_field = 'course_id'
    serializer_class = CourseSerializer

    def get_object(self, queryset=None):
        course_id = self.kwargs.get('course_id')
        course = Course.get(course_id)

        if course:
            return course

        raise Http404

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        self.object = self.get_object_or_none()

        # TODO Determine why the deserialization results in the removal of the verified mode,
        # and addition of an honor mode.
        # Check from_native
        serializer = self.get_serializer(self.object, data=request.DATA,
                                         files=request.FILES, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            self.pre_save(serializer.object)
        except ValidationError as err:
            # full_clean on model instance may be called in pre_save,
            # so we have to handle eventual errors.
            return Response(err.message_dict, status=status.HTTP_400_BAD_REQUEST)

        if self.object is None:
            self.object = serializer.save(force_insert=True)
            self.post_save(self.object, created=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        self.object = serializer.save(force_update=True)
        self.post_save(self.object, created=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
