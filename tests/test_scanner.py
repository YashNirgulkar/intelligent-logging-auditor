from app.scanner import analyze_python_file


def test_risky_function_without_logging_flagged():
    findings=analyze_python_file("a.py","def f(url):\n    requests.get(url)\n")
    assert any(f.rule=="risky_operation_without_logging" for f in findings)

def test_logging_in_function_suppresses_risky_rule():
    findings=analyze_python_file("a.py",'def f(url):\n    logger.info("start")\n    requests.get(url)\n')
    assert not any(f.rule=="risky_operation_without_logging" for f in findings)

def test_swallowed_exception_flagged():
    findings=analyze_python_file("a.py","def f():\n    try:\n        run()\n    except Exception:\n        return None\n")
    assert any(f.rule=="exception_without_log_or_reraise" for f in findings)

def test_syntax_error_reported():
    assert analyze_python_file("bad.py","def broken(:")[0].rule=="parse_error"
