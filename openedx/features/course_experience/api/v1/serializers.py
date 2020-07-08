"""
Serializer for Course Deadlines (Mobile)
"""
from rest_framework import serializers
from lms.djangoapps.course_home_api.mixins import DatesBannerSerializerMixin


class CourseDeadlinesMobileSerializer(DatesBannerSerializerMixin):
    content_type_gating_enabled = serializers.BooleanField()
    missed_deadlines = serializers.BooleanField()
    missed_gated_content = serializers.BooleanField()
    verified_upgrade_link = serializers.URLField()
