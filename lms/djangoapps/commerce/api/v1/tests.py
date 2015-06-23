from django.test import TestCase


class ApiViewAuthMixin(object):
    def test_authentication_required(self):
        """ Verify only authenticated users can access the view. """
        pass


class CourseListCreateViewTests(TestCase):
    def test_list(self):
        """ Verify the view lists the available courses and modes. """
        self.fail()
