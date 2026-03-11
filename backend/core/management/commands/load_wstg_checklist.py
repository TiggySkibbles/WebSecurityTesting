import urllib.request
import json
from django.core.management.base import BaseCommand
from core.models import WSTGCategory, WSTGTest

class Command(BaseCommand):
    help = 'Fetches the OWASP WSTG v4.2 JSON checklist and loads it into the database'

    def handle(self, *args, **kwargs):
        url = 'https://raw.githubusercontent.com/OWASP/wstg/master/checklists/checklist.json'
        self.stdout.write(self.style.SUCCESS(f'Fetching data from {url}...'))
        
        try:
            response = urllib.request.urlopen(url)
            data = json.loads(response.read())
            
            categories_data = data.get('categories', {})
            count_categories = 0
            count_tests = 0
            
            for cat_name, cat_content in categories_data.items():
                tests = cat_content.get('tests', [])
                if not tests:
                    continue
                
                # Derive WSTGCategory ref_id from the first test's id (e.g. "WSTG-INFO-01" -> "WSTG-INFO")
                first_test_id = tests[0].get('id', '')
                parts = first_test_id.split('-')
                if len(parts) >= 2:
                    cat_ref_id = f"{parts[0]}-{parts[1]}"
                else:
                    cat_ref_id = f"WSTG-{cat_name[:4].upper()}"
                
                category, created = WSTGCategory.objects.get_or_create(
                    ref_id=cat_ref_id,
                    defaults={'name': cat_name}
                )
                if created:
                    count_categories += 1
                
                for test_data in tests:
                    test_id = test_data.get('id')
                    test_name = test_data.get('name')
                    test_reference = test_data.get('reference')
                    
                    if not test_id or not test_name:
                        continue
                        
                    test, t_created = WSTGTest.objects.update_or_create(
                        ref_id=test_id,
                        defaults={
                            'category': category,
                            'name': test_name,
                            'reference_url': test_reference
                        }
                    )
                    if t_created:
                        count_tests += 1
                        
            self.stdout.write(self.style.SUCCESS(f'Successfully loaded {count_categories} new categories and {count_tests} new tests!'))
            
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error loading WSTG data: {e}'))
