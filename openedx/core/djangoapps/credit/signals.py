"""
This file contains receivers of course publication signals.
"""

from django.dispatch import receiver
from opaque_keys.edx.keys import CourseKey

from xmodule.modulestore.django import SignalHandler
from courseware.grades import MIN_GRADE_REQUIREMENT_STATUS


@receiver(SignalHandler.course_published)
def listen_for_course_publish(sender, course_key, **kwargs):  # pylint: disable=unused-argument
    """Receive 'course_published' signal and kick off a celery task to update
    the credit course requirements.
    """

    # Import here, because signal is registered at startup, but items in tasks
    # are not yet able to be loaded
    from .tasks import update_credit_course_requirements

    update_credit_course_requirements.delay(unicode(course_key))

@receiver(MIN_GRADE_REQUIREMENT_STATUS)
def listen_for_grade_calculation(sender, username, grade_summary, course_key, **kwargs):  # pylint: disable=unused-argument
    """Receive 'MIN_GRADE_REQUIREMENT_STATUS' signal and update minimum grade
    requirement status.
    """

    from openedx.core.djangoapps.credit.models import CreditCourse, CreditRequirementStatus, CreditRequirement
    course_key = CourseKey.from_string(unicode(course_key))
    is_credit_course = CreditCourse.is_credit_course(course_key)
    if is_credit_course:
        requirement = CreditRequirement.get_course_requirement(course_key, 'grade', 'grade')
        if requirement:
            criteria = requirement.criteria
            if criteria:
                min_grade = criteria.get('min_grade')
                if grade_summary['percent'] >= min_grade:
                    CreditRequirementStatus.add_or_update_requirement_status(
                        username, requirement, status="satisfied", reason=grade_summary['percent']
                    )
