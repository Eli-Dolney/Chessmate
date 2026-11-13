"""Portable mocked launcher checks. These do not substitute for an actual Mac run."""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile

project = Path(__file__).resolve().parent.parent
bash = shutil.which('bash') or r'C:\Program Files\Git\bin\bash.exe'
if os.name == 'nt':
    bash = r'C:\Program Files\Git\bin\bash.exe'

with tempfile.TemporaryDirectory(prefix='Chessmate launcher tests ') as temp:
    root = Path(temp)
    scripts = root / 'scripts'
    scripts.mkdir()
    for path in project.glob('scripts/*macos*.sh'):
        shutil.copyfile(path, scripts / path.name)
    for path in project.glob('*.command'):
        shutil.copyfile(path, root / path.name)
    mocks = root / 'mock-bin'
    mocks.mkdir()
    def mock(name, body):
        path = mocks / name
        path.write_text('#!/bin/bash\n' + body + '\n', encoding='utf-8', newline='\n')
        path.chmod(0o755)
    mock('uname', 'if [ "$1" = -s ]; then echo "${MOCK_OS:-Darwin}"; else echo "${MOCK_ARCH:-arm64}"; fi')
    mock('sysctl', 'echo "${MOCK_ARM:-1}"')
    mock('lsof', 'exit "${MOCK_PORT_FREE:-0}"')
    mock('open', 'echo "OPEN $*"')
    mock('curl', '''while [ "$#" -gt 0 ]; do
 if [ "$1" = -o ]; then printf bad-archive > "$2"; exit 0; fi
 shift
done
if [ -n "${MOCK_HEALTH:-}" ]; then printf '%s' "$MOCK_HEALTH"; else exit 7; fi''')
    mock('shasum', 'cat >/dev/null; echo "Checksum mismatch" >&2; exit 1')
    mock('tar', 'echo "UNEXPECTED EXTRACTION"; exit 90')
    mock('ps', '''if [ "${MOCK_OWN:-0}" = 1 ]; then
 task_fake_root="$(cd "$(dirname "$0")/.." && pwd -P)"
 echo "$task_fake_root/.runtime/node-v22.23.4-darwin-arm64/bin/node $task_fake_root/scripts/serve.mjs"
else echo 'another-program'; fi''')
    # The fixture Node handles health only; it is never an actual Mac runtime.
    runtime = root / '.runtime/node-v22.23.4-darwin-arm64/bin'
    runtime.mkdir(parents=True)
    node = runtime / 'node'
    node.write_text('''#!/bin/bash
case "$3" in '{"app":"Chessmate","version":1}'|'{"app":"LTW-Chess","version":1}') exit 0;; *) exit 1;; esac
''', encoding='utf-8', newline='\n')
    node.chmod(0o755)
    (root / 'dist').mkdir()
    (root / 'dist/index.html').write_text('fixture')
    # Use Bash's own path conversion, so tests also run from a Windows temp directory.
    script_root = subprocess.check_output([bash, '-c', 'cd "$1" && pwd -P', '_', str(root)], text=True).strip()
    def run(command, **env):
        prefix = 'export PATH="$1/mock-bin:$PATH"; cd "$1"; '
        return subprocess.run([bash, '-c', prefix + command, '_', script_root], env={**os.environ, **env}, capture_output=True, text=True, timeout=15)
    def check(command, code=0, contains=None, **env):
        result = run(command, **env)
        assert (result.returncode == 0) == (code == 0), (command, result.returncode, result.stdout, result.stderr)
        if contains:
            assert contains in result.stdout + result.stderr, (command, result.stdout, result.stderr)
        return result
    for path in [*scripts.glob('*.sh'), *root.glob('*.command')]:
        check('bash -n "' + str(path.relative_to(root)).replace('\\', '/') + '"')
    check('source scripts/macos-common.sh; echo "$task_arch"', contains='arm64')
    check('source scripts/macos-common.sh; echo "$task_arch"', contains='x64', MOCK_ARM='0', MOCK_ARCH='x86_64')
    check('source scripts/macos-common.sh', code=1, contains='Unsupported', MOCK_ARM='0', MOCK_ARCH='mips')
    check('bash scripts/launch-macos.sh', code=1, contains='for macOS', MOCK_OS='Linux')
    check('bash scripts/launch-macos.sh', code=1, contains='occupied')
    check('bash scripts/launch-macos.sh', code=1, contains='occupied', MOCK_HEALTH='{"app":"Other"}')
    check('bash scripts/launch-macos.sh', contains='OPEN http://127.0.0.1:4173/', MOCK_HEALTH='{"app":"Chessmate","version":1}')
    result = check('bash scripts/launch-macos.sh --no-browser', MOCK_HEALTH='{"app":"Chessmate","version":1}')
    assert 'OPEN' not in result.stdout
    check('source scripts/macos-common.sh; task_owns_pid 123', MOCK_OWN='1')
    check('source scripts/macos-common.sh; task_owns_pid 123', code=1)
    check('source scripts/macos-common.sh; task_owns_pid bad', code=1, MOCK_OWN='1')
    (root / '.runtime/server-macos.pid').write_text('123')
    check('bash scripts/stop-macos.sh', contains='nothing was stopped')
    assert not (root / '.runtime/server-macos.pid').exists()
    node.unlink()
    check('bash scripts/launch-macos.sh', code=1, contains='Run Setup')
    result = check('bash scripts/setup-macos.sh', code=1, contains='Checksum mismatch')
    assert 'UNEXPECTED EXTRACTION' not in result.stdout
    print('Passed 7 shell syntax checks and 14 mocked Mac launcher scenarios (including paths with spaces).')
