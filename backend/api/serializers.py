from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Project, ProjectShare, WSTGCategory, WSTGTest, TestExecution, Evidence
import os
import mimetypes

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'email']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data.get('email', '')
        )
        return user

class WSTGTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WSTGTest
        fields = ['id', 'ref_id', 'name', 'reference_url']

class WSTGCategorySerializer(serializers.ModelSerializer):
    tests = WSTGTestSerializer(many=True, read_only=True)
    
    class Meta:
        model = WSTGCategory
        fields = ['id', 'ref_id', 'name', 'tests']

class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = ['id', 'file', 'original_filename', 'description', 'uploaded_at']
        read_only_fields = ['original_filename']

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 10MB.")

        ext = os.path.splitext(value.name)[1].lower()
        mime_type, _ = mimetypes.guess_type(value.name)
        content_type = getattr(value, 'content_type', '')

        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'text/plain', 'text/markdown', 'application/pdf',
            'video/mp4', 'video/webm', 'video/x-msvideo'
        ]
        
        allowed_extensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.txt', '.md', '.pdf',
            '.mp4', '.webm', '.avi'
        ]

        effective_mime = content_type if content_type and content_type != 'application/octet-stream' else mime_type

        if effective_mime not in allowed_types or ext not in allowed_extensions:
             raise serializers.ValidationError("File type not allowed. Allowed types: Images, Text, PDF, Videos.")

        # Disarm images
        if effective_mime and effective_mime.startswith('image/'):
            try:
                from PIL import Image
                import io
                image = Image.open(value)
                img_format = image.format or 'JPEG'
                if img_format == 'JPEG' and image.mode in ('RGBA', 'P'):
                    image = image.convert('RGB')
                
                output = io.BytesIO()
                image.save(output, format=img_format)
                output.seek(0)
                
                from django.core.files.uploadedfile import InMemoryUploadedFile
                return InMemoryUploadedFile(
                    file=output,
                    field_name=getattr(value, 'field_name', 'file'),
                    name=value.name,
                    content_type=effective_mime,
                    size=output.getbuffer().nbytes,
                    charset=getattr(value, 'charset', None)
                )
            except Exception as e:
                raise serializers.ValidationError(f"Invalid image file: {str(e)}")

        return value

class TestExecutionSerializer(serializers.ModelSerializer):
    test_id = serializers.PrimaryKeyRelatedField(source='test', queryset=WSTGTest.objects.all())
    test = WSTGTestSerializer(read_only=True)
    evidence = EvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = TestExecution
        fields = ['id', 'project', 'test_id', 'test', 'status', 'notes', 'updated_at', 'evidence']
        read_only_fields = ['project']

class ProjectShareSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all())
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectShare
        fields = ['id', 'user_id', 'user', 'access_level', 'created_at']

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    shares = ProjectShareSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'target_url', 'owner', 'created_at', 'updated_at', 'shares']
        read_only_fields = ['owner']
