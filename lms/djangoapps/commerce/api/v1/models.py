from itertools import groupby
import logging

from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey

from course_modes.models import CourseMode

log = logging.getLogger(__name__)


class Course(object):
    id = None
    modes = None

    def __init__(self, id, modes):
        self.id = CourseKey.from_string(unicode(id))
        self.modes = list(modes)

    def save(self, *args, **kwargs):
        for mode in self.modes:
            mode.course_id = self.id
            mode.save()

    def update(self, attrs):
        pass
        # updated_modes = attrs.get('modes', [])
        #
        # for updated in updated_modes:
        #     matched = False
        #     for mode in self.modes:
        #         if mode.mode_slug == updated.mode_slug:
        #             matched = True
        #             mode.min_price = updated.min_price
        #             mode.currency = updated.currency
        #             mode.sku = updated.sku
        #             break
        #
        #     if not matched:
        #         self.modes.append(
        #             CourseMode(course_id=self.id, mode_slug=updated.mode_slug, mode_display_name=updated.mode_slug,
        #                        min_price=updated.min_price, currency=updated.currency, sku=updated.sku))

    @classmethod
    def get(cls, course_id):
        """ Retrieve a single course. """
        try:
            course_id = CourseKey.from_string(unicode(course_id))
        except InvalidKeyError:
            log.debug('[%s] is not a valid course key.', course_id)
            raise ValueError

        course_modes = CourseMode.objects.filter(course_id=course_id)

        if course_modes:
            return cls(unicode(course_id), list(course_modes))

        return None

    @classmethod
    def all(cls):
        """ Retrieve all courses/modes. """
        course_modes = CourseMode.objects.order_by('course_id')
        courses = []

        for course_id, modes in groupby(course_modes, lambda o: o.course_id):
            courses.append(cls(course_id, list(modes)))
