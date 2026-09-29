"""Prose inputs must survive CLI parsing and be refused before network writes."""
import contextlib
import io
from pathlib import Path
import runpy
import sys
import tempfile
import unittest
from unittest.mock import patch

CLI = Path(__file__).resolve().parents[2] / 'skill/scripts/holloway'


class CliMarkdownTests(unittest.TestCase):
    def setUp(self):
        self.cli = runpy.run_path(str(CLI))
        self.globals = self.cli['main'].__globals__
        self.calls = []
        self.markdown = '## Review\n\n**Status:** ready\n\n- Verified `routing.ts`\n- [ ] Human review'
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.file = Path(self.temp.name) / 'brief.md'
        self.file.write_text(self.markdown)

    def request(self, method, path, body=None, **kwargs):
        self.cli['validate_prose_payload'](body)
        self.calls.append((method, path, body))
        return {'id': 'review-id', 'title': 'Review fixture', 'status': 'active'}

    def invoke(self, *arguments, stdin=''):
        self.globals['api_request'] = self.request
        with patch.object(sys, 'argv', ['holloway', *arguments]), patch.object(sys, 'stdin', io.StringIO(stdin)), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.cli['main']()

    def test_prose_flags_resolve_utf8_files_across_commands(self):
        cases = [
            (['project-create', 'Review', '--description'], 'description'),
            (['project-update', 'p', '--description'], 'description'),
            (['task-create', 'p', 'Review', '--description'], 'description'),
            (['task-update', 'p', 't', '--description'], 'description'),
            (['sprint-create', 'p', 'Review', '--goal'], 'goal'),
            (['sprint-update', 'p', 's', '--goal'], 'goal'),
            (['comment', 'p', 't', '--content'], 'content'),
            (['task-run-start', 'p', 't', '--summary'], 'summary'),
            (['task-run-update', 'p', 't', 'r', '--error-message'], 'error_message'),
            (['checkpoint', 'p', 't', 'r', '--key', 'review', '--summary'], 'summary'),
            (['blocker-follow-up', 'p', 't', '--owner', 'Operator', '--due-at', '2026-10-01T12:00:00Z', '--next-action'], 'next_action'),
        ]
        for arguments, field in cases:
            with self.subTest(field=field, arguments=arguments):
                self.invoke(*arguments, '@' + str(self.file))
                self.assertEqual(self.calls[-1][2][field], self.markdown)

    def test_stdin_and_empty_description_updates(self):
        self.invoke('comment', 'p', 't', '--content', '-', stdin=self.markdown)
        self.assertEqual(self.calls[-1][2]['content'], self.markdown)
        self.invoke('project-update', 'p', '--description', '')
        self.assertEqual(self.calls[-1][2]['description'], '')
        self.invoke('task-update', 'p', 't', '--description', '')
        self.assertEqual(self.calls[-1][2]['description'], '')
        self.invoke('sprint-update', 'p', 's', '--goal', '')
        self.assertEqual(self.calls[-1][2]['goal'], '')

    def test_message_and_control_notes_resolve_files(self):
        self.invoke('send', 'c', '--content', '@' + str(self.file))
        self.assertEqual(self.calls[-1][2]['content']['text'], self.markdown)
        self.invoke('receipt', 'c', 'm', '--note', '@' + str(self.file))
        self.assertEqual(self.calls[-1][2]['content']['note'], self.markdown)

    def test_malformed_prose_never_reaches_the_request(self):
        for value in ['word ' * 140, '## Scope\\n\\n- Not real breaks']:
            with self.subTest(value=value[:20]), self.assertRaises(SystemExit):
                self.invoke('project-create', 'Review', '--description', value)
        self.assertEqual(self.calls, [])

    def test_multiple_stdin_fields_are_refused_before_consumption(self):
        with self.assertRaises(SystemExit):
            self.invoke('task-run-update', 'p', 't', 'r', '--summary', '-', '--error-message', '-', stdin=self.markdown)
        self.assertEqual(self.calls, [])

    def test_actual_request_validates_before_opening_network(self):
        self.globals['API_KEY'] = 'review-only'
        self.globals['SIGNING_SECRET'] = 'review-only'
        with patch('urllib.request.urlopen') as urlopen, contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.cli['api_request']('POST', '/api/v1/projects', {'title': 'Review', 'description': 'word ' * 140})
        urlopen.assert_not_called()


if __name__ == '__main__':
    unittest.main()
