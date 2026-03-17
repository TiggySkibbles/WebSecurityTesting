import json
import os
from django.core.management.base import BaseCommand
from core.models import WSTGCategory, WSTGTest

CHECKLIST_FILENAME = 'wstg_checklist.json'
REMOTE_URL = 'https://raw.githubusercontent.com/OWASP/wstg/master/checklists/checklist.json'


class Command(BaseCommand):
    help = 'Loads the OWASP WSTG v4.2 checklist into the database from the bundled JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--remote',
            action='store_true',
            help='Force fetch from GitHub instead of using the bundled file',
        )

    def handle(self, *args, **kwargs):
        use_remote = kwargs.get('remote', False)
        data = None

        if not use_remote:
            # Load from bundled JSON file
            local_path = os.path.join(os.path.dirname(__file__), CHECKLIST_FILENAME)
            if os.path.exists(local_path):
                self.stdout.write(f'Loading from bundled file: {local_path}')
                with open(local_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                self.stdout.write(self.style.WARNING(
                    f'Bundled file not found at {local_path}, falling back to remote fetch...'
                ))

        if data is None:
            # Fetch from remote
            import urllib.request
            self.stdout.write(self.style.SUCCESS(f'Fetching data from {REMOTE_URL}...'))
            try:
                response = urllib.request.urlopen(REMOTE_URL)
                data = json.loads(response.read())
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Error fetching WSTG data: {e}'))
                return

        self._load_data(data)

    def _load_data(self, data):
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

        self.stdout.write(self.style.SUCCESS(
            f'Successfully loaded {count_categories} new categories and {count_tests} new tests!'
        ))
