from rest_framework import serializers

from course_modes.models import CourseMode


class CourseModeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='mode_slug')
    price = serializers.IntegerField(source='min_price')

    class Meta(object):
        model = CourseMode
        fields = ('name', 'currency', 'price', 'sku')


# class CourseModeSerializer(serializers.Serializer):
#     name = serializers.CharField(source='mode_slug')
#     currency = serializers.CharField()
#     price = serializers.IntegerField(source='min_price')
#     sku = serializers.CharField()
#
#     def restore_object(self, attrs, instance=None):
#         if instance is not None:
#             for attr, value in attrs.iteritems():
#                 setattr(instance, attr, value)
#             return instance
#         return attrs


class CourseSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    modes = CourseModeSerializer(many=True, allow_add_remove=True)
