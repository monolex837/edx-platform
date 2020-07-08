"""
Unit tests for Contentstore views.
"""

from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from opaque_keys.edx.keys import CourseKey

from lms.djangoapps.courseware.tests.factories import GlobalStaffFactory, InstructorFactory
from student.tests.factories import UserFactory
from xmodule.modulestore.tests.django_utils import SharedModuleStoreTestCase
from xmodule.modulestore.tests.factories import CourseFactory


class ProctoringExamSettingsGetTests(SharedModuleStoreTestCase, APITestCase):
    """ Tests for proctored exam settings GETs """
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.course_key = CourseKey.from_string('course-v1:edX+ToyX+Toy_Course')
        cls.other_course_key = CourseKey.from_string('course-v1:edX+ToyX+Other_Course')
        cls.course = CourseFactory.create(
            org=cls.course_key.org,
            course=cls.course_key.course,
            run=cls.course_key.run
        )

        cls.password = 'password'
        cls.student = UserFactory.create(username='student', password=cls.password)
        cls.global_staff = GlobalStaffFactory(username='global-staff', password=cls.password)
        cls.course_instructor = InstructorFactory(
            username='instructor',
            password=cls.password,
            course_key=cls.course_key
        )
        cls.other_course_instructor = InstructorFactory(
            username='other-course-instructor',
            password=cls.password,
            course_key=cls.other_course_key
        )

    def tearDown(self):
        super().tearDown()
        self.client.logout()

    def get_url(self, course_key):
        return reverse(
            'cms.djangoapps.contentstore:v1:proctored_exam_settings',
            kwargs={'course_id': course_key}
        )

    def test_403_if_student(self):
        self.client.login(username=self.student.username, password=self.password)
        url = self.get_url(self.course.id)
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_403_if_instructor_in_another_course(self):
        self.client.login(
            username=self.other_course_instructor.username,
            password=self.password
        )
        url = self.get_url(self.course.id)
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_200_global_staff(self):
        self.client.login(username=self.global_staff.username, password=self.password)
        url = self.get_url(self.course.id)
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_200_course_instructor(self):
        self.client.login(username=self.course_instructor.username, password=self.password)
        url = self.get_url(self.course.id)
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
