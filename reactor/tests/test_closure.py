import importlib.machinery
import importlib.util
from pathlib import Path
import unittest

from a2a_reactor.closure import read_close_outcome, work_was_accepted

loader = importlib.machinery.SourceFileLoader("holloway_closure_cli", str(Path(__file__).resolve().parents[2] / "skill/scripts/holloway"))
spec = importlib.util.spec_from_loader(loader.name, loader)
cli = importlib.util.module_from_spec(spec)
loader.exec_module(cli)


class ClosureAcceptance(unittest.TestCase):
    def test_cli_and_reactor_preserve_manual_acceptance_and_refusal_precedence(self):
        approved = {"status": "closed", "closed_by": "clawdius", "completion_approved_at": "2026-09-28T18:47:35.968Z"}
        cases = [
            (approved, "completed-approved"),
            ({**approved, "closed_without_approval": True}, "closed-unapproved"),
            ({**approved, "closed_by": "system:expiry"}, "expired"),
            ({"status": "closed", "closed_by": "clawdius"}, "closed-by-participant"),
            ({"status": "closed", "completion_requires_approval": True}, "closed-unapproved"),
            ({**approved, "outcome": "closed-unapproved"}, "closed-unapproved"),
        ]
        for row, expected in cases:
            with self.subTest(row=row):
                self.assertEqual(cli.contract_close_outcome(row), expected)
                outcome = read_close_outcome(row)
                self.assertEqual(outcome.value, expected)
                self.assertEqual(work_was_accepted(outcome), expected == "completed-approved")

    def test_cli_does_not_treat_approval_as_closure_of_an_active_contract(self):
        self.assertIsNone(cli.contract_close_outcome({"status": "active", "completion_approved_at": "2026-09-28T18:47:35.968Z"}))
