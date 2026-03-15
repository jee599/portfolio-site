#!/usr/bin/env python3
"""
Claude Code .jsonl 세션을 파싱해서 빌드 로그용 요약을 생성한다.

Usage:
  python3 scripts/parse-sessions.py --project saju_global --since 2026-03-10
  python3 scripts/parse-sessions.py --list
  python3 scripts/parse-sessions.py --project saju_global --output summary.md
"""

import json
import os
import sys
import glob
import argparse
from datetime import datetime, timedelta
from collections import Counter
from pathlib import Path

CLAUDE_PROJECTS_DIR = os.path.expanduser('~/.claude/projects')

# project slug → .claude/projects 디렉토리명 매핑
# 디렉토리명은 경로를 하이픈으로 치환한 형태
PROJECT_MAP = {
    'saju_global': ['-Users-jidong-saju-global'],
    'portfolio-site': ['-Users-jidong'],  # home dir sessions = portfolio work
    'coffee-chat': ['-Users-jidong-projects-coffeechat'],
    'trading-bot': ['-Users-jidong-xrp-trading-bot'],
    'claudebook': ['-Users-jidong-Downloads-claudebook'],
    'LLMTrio': ['-Users-jidong-LLMTrio'],
    'fatesaju': ['-Users-jidong-fatesaju'],
}


def find_project_dirs(slug: str) -> list[str]:
    """프로젝트 slug에 해당하는 .claude/projects 디렉토리들을 찾는다. worktree 포함."""
    base_dirs = PROJECT_MAP.get(slug, [])
    result = []
    for d in os.listdir(CLAUDE_PROJECTS_DIR):
        full = os.path.join(CLAUDE_PROJECTS_DIR, d)
        if not os.path.isdir(full):
            continue
        for base in base_dirs:
            if d == base or d.startswith(base + '-'):
                result.append(full)
    return result


def parse_session(filepath: str) -> dict:
    """하나의 .jsonl 세션을 파싱해서 요약 정보를 추출한다."""
    session = {
        'file': os.path.basename(filepath),
        'user_prompts': [],
        'assistant_texts': [],
        'tool_counts': Counter(),
        'files_edited': set(),
        'files_created': set(),
        'files_read': set(),
        'bash_commands': [],
        'timestamps': [],
        'errors': [],
        'model': None,
    }

    with open(filepath) as f:
        for line in f:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue

            t = d.get('type', '')
            ts = d.get('timestamp', '')
            if ts:
                session['timestamps'].append(ts)

            msg = d.get('message')
            if not msg:
                continue

            # User message
            if t == 'user':
                text = extract_text(msg)
                if text and '<ide_' not in text and '<system' not in text:
                    session['user_prompts'].append(text)

            # Assistant message
            elif t == 'assistant':
                content = []
                if isinstance(msg, dict):
                    content = msg.get('content', [])
                    if not session['model']:
                        session['model'] = msg.get('model')
                elif isinstance(msg, list):
                    content = msg

                if not isinstance(content, list):
                    continue

                for item in content:
                    if not isinstance(item, dict):
                        continue
                    if item.get('type') == 'text' and item.get('text', '').strip():
                        session['assistant_texts'].append(item['text'].strip())
                    elif item.get('type') == 'tool_use':
                        name = item.get('name', '')
                        session['tool_counts'][name] += 1
                        inp = item.get('input', {})
                        if isinstance(inp, dict):
                            if name == 'Edit' and inp.get('file_path'):
                                session['files_edited'].add(shorten_path(inp['file_path']))
                            elif name == 'Write' and inp.get('file_path'):
                                session['files_created'].add(shorten_path(inp['file_path']))
                            elif name == 'Read' and inp.get('file_path'):
                                session['files_read'].add(shorten_path(inp['file_path']))
                            elif name == 'Bash' and inp.get('command'):
                                cmd = inp['command'].strip()
                                if cmd and not cmd.startswith('cat '):
                                    session['bash_commands'].append(cmd[:120])

            # Tool result errors
            elif t == 'user':
                if isinstance(msg, dict):
                    content = msg.get('content', [])
                    if isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and item.get('type') == 'tool_result':
                                if item.get('is_error'):
                                    session['errors'].append(str(item.get('content', ''))[:200])

    return session


def extract_text(msg) -> str:
    """message 필드에서 텍스트를 추출한다."""
    if isinstance(msg, str):
        return msg.strip()
    if isinstance(msg, dict):
        content = msg.get('content', [])
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get('type') == 'text':
                    return item.get('text', '').strip()
    if isinstance(msg, list):
        for item in msg:
            if isinstance(item, dict) and item.get('type') == 'text':
                return item.get('text', '').strip()
    return ''


def shorten_path(p: str) -> str:
    """긴 경로를 상대 경로로 줄인다."""
    home = os.path.expanduser('~')
    if p.startswith(home):
        return '~' + p[len(home):]
    return p


def get_session_time_range(session: dict) -> tuple[str, str]:
    ts = sorted(session['timestamps'])
    if not ts:
        return ('?', '?')
    return (ts[0][:19], ts[-1][:19])


def format_duration(start: str, end: str) -> str:
    try:
        s = datetime.fromisoformat(start.replace('Z', '+00:00'))
        e = datetime.fromisoformat(end.replace('Z', '+00:00'))
        delta = e - s
        mins = int(delta.total_seconds() / 60)
        if mins < 60:
            return f'{mins}min'
        return f'{mins // 60}h {mins % 60}min'
    except:
        return '?'


def generate_summary(slug: str, sessions: list[dict], since: str) -> str:
    """파싱된 세션들을 빌드 로그 소스용 마크다운으로 변환한다."""
    lines = []
    lines.append(f'# {slug} 세션 요약')
    lines.append(f'기간: {since} 이후 | 세션 수: {len(sessions)}')
    lines.append('')

    total_tools = Counter()
    all_edited = set()
    all_created = set()

    for i, s in enumerate(sessions):
        start, end = get_session_time_range(s)
        dur = format_duration(start, end)
        total_tool_calls = sum(s['tool_counts'].values())

        lines.append(f'## 세션 {i+1}: {start[:10]} ({dur}, {total_tool_calls} tool calls)')
        if s['model']:
            lines.append(f'모델: `{s["model"]}`')
        lines.append('')

        # User prompts
        if s['user_prompts']:
            lines.append('### 사용자 프롬프트')
            for p in s['user_prompts']:
                # 긴 프롬프트는 첫 500자만
                truncated = p[:500] + ('...' if len(p) > 500 else '')
                lines.append(f'```')
                lines.append(truncated)
                lines.append(f'```')
                lines.append('')

        # What was done (assistant texts)
        if s['assistant_texts']:
            lines.append('### 작업 내용')
            for t in s['assistant_texts'][:10]:
                text = t[:300] + ('...' if len(t) > 300 else '')
                lines.append(f'- {text}')
            lines.append('')

        # Files changed
        if s['files_edited'] or s['files_created']:
            lines.append('### 변경된 파일')
            for f in sorted(s['files_edited']):
                lines.append(f'- **수정**: `{f}`')
            for f in sorted(s['files_created']):
                lines.append(f'- **생성**: `{f}`')
            lines.append('')

        # Tool usage
        if s['tool_counts']:
            top_tools = s['tool_counts'].most_common(5)
            lines.append(f'### 도구 사용: {", ".join(f"{n}({c})" for n, c in top_tools)}')
            lines.append('')

        # Errors
        if s['errors']:
            lines.append(f'### 에러/삽질 ({len(s["errors"])}건)')
            for e in s['errors'][:5]:
                lines.append(f'- `{e[:150]}`')
            lines.append('')

        lines.append('---')
        lines.append('')

        total_tools += s['tool_counts']
        all_edited |= s['files_edited']
        all_created |= s['files_created']

    # 전체 통계
    lines.append('## 전체 통계')
    lines.append(f'- 총 tool calls: {sum(total_tools.values())}')
    lines.append(f'- 도구별: {", ".join(f"{n}({c})" for n, c in total_tools.most_common(8))}')
    lines.append(f'- 수정 파일: {len(all_edited)}개')
    lines.append(f'- 생성 파일: {len(all_created)}개')

    return '\n'.join(lines)


def list_projects():
    """사용 가능한 프로젝트 목록을 출력한다."""
    print('사용 가능한 프로젝트:')
    for slug, dirs in PROJECT_MAP.items():
        session_count = 0
        total_size = 0
        for d in dirs:
            full = os.path.join(CLAUDE_PROJECTS_DIR, d)
            if os.path.isdir(full):
                jsonls = glob.glob(os.path.join(full, '*.jsonl'))
                session_count += len(jsonls)
                total_size += sum(os.path.getsize(f) for f in jsonls)
            # worktrees
            for wd in os.listdir(CLAUDE_PROJECTS_DIR):
                if wd.startswith(d + '-') and wd != d:
                    wfull = os.path.join(CLAUDE_PROJECTS_DIR, wd)
                    if os.path.isdir(wfull):
                        wjsonls = glob.glob(os.path.join(wfull, '*.jsonl'))
                        session_count += len(wjsonls)
                        total_size += sum(os.path.getsize(f) for f in wjsonls)
        print(f'  {slug}: {session_count} sessions, {total_size / 1024 / 1024:.1f}MB')


def main():
    parser = argparse.ArgumentParser(description='Claude Code 세션 파서')
    parser.add_argument('--project', '-p', help='프로젝트 slug')
    parser.add_argument('--since', '-s', help='이 날짜 이후 세션만 (YYYY-MM-DD)', default=None)
    parser.add_argument('--days', '-d', type=int, help='최근 N일', default=7)
    parser.add_argument('--list', '-l', action='store_true', help='프로젝트 목록')
    parser.add_argument('--output', '-o', help='출력 파일 경로')
    args = parser.parse_args()

    if args.list:
        list_projects()
        return

    if not args.project:
        parser.error('--project 또는 --list 필요')

    since = args.since or (datetime.now() - timedelta(days=args.days)).strftime('%Y-%m-%d')

    # 프로젝트 디렉토리 찾기
    dirs = find_project_dirs(args.project)
    if not dirs:
        print(f'프로젝트 "{args.project}"의 세션 디렉토리를 찾을 수 없다.', file=sys.stderr)
        print(f'PROJECT_MAP에 매핑을 추가해라.', file=sys.stderr)
        sys.exit(1)

    # .jsonl 파일 수집 (since 이후)
    jsonl_files = []
    for d in dirs:
        for f in glob.glob(os.path.join(d, '*.jsonl')):
            mtime = datetime.fromtimestamp(os.path.getmtime(f))
            since_dt = datetime.strptime(since, '%Y-%m-%d')
            if mtime >= since_dt:
                jsonl_files.append((mtime, f))

    jsonl_files.sort()
    print(f'{args.project}: {len(jsonl_files)} sessions since {since}', file=sys.stderr)

    if not jsonl_files:
        print('해당 기간의 세션이 없다.', file=sys.stderr)
        sys.exit(0)

    # 파싱
    sessions = []
    for mtime, filepath in jsonl_files:
        size_mb = os.path.getsize(filepath) / 1024 / 1024
        print(f'  parsing {os.path.basename(filepath)} ({size_mb:.1f}MB)...', file=sys.stderr)
        # 100MB 이상은 스킵 (OOM 방지)
        if size_mb > 100:
            print(f'    skipped (too large)', file=sys.stderr)
            continue
        s = parse_session(filepath)
        # 빈 세션 스킵
        if sum(s['tool_counts'].values()) == 0 and not s['assistant_texts']:
            continue
        sessions.append(s)

    if not sessions:
        print('유효한 세션이 없다.', file=sys.stderr)
        sys.exit(0)

    summary = generate_summary(args.project, sessions, since)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(summary)
        print(f'출력: {args.output}', file=sys.stderr)
    else:
        print(summary)


if __name__ == '__main__':
    main()
