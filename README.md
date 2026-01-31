# 빙고 게임 시스템

3개의 독립된 Electron 데스크탑 앱으로 구성된 실시간 빙고 게임 시스템

## 📁 프로젝트 구조

```
bingo-system/
├── apps/
│   ├── draw-app/          # 1번 앱: 번호 추첨기
│   ├── board-app/         # 2번 앱: 빙고판 디스플레이
│   └── admin-app/         # 3번 앱: 관리자 컨트롤
├── shared/                # 공통 코드
├── .env                   # Supabase 환경변수
└── supabase-setup.sql     # Supabase 테이블 설정 SQL
```

## 🚀 설치 및 실행

### 1단계: Supabase 설정

1. https://supabase.com 에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-setup.sql` 파일의 내용 실행
3. Database > Replication에서 다음 테이블의 Realtime 활성화:
   - `game_state`
   - `drawn_numbers`
   - `bingo_lines`

### 2단계: 환경변수 설정

`.env` 파일에 Supabase 정보 입력:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3단계: 의존성 설치

```bash
# 루트 디렉토리에서
npm install

# 각 앱의 의존성 설치
cd apps/draw-app && npm install
cd ../board-app && npm install
cd ../admin-app && npm install
cd ../..
```

### 4단계: 앱 실행

**반드시 터미널 3개를 열어서 세 앱을 모두 실행해야 합니다.** (한 개라도 안 켜면 게임 시작/추첨/보드가 서로 반응하지 않습니다.)

```bash
# 터미널 1: 추첨 앱
npm run dev:draw

# 터미널 2: 빙고판 앱 ← 이걸 안 켜면 "보드가 안 보인다"고 느껴질 수 있음
npm run dev:board

# 터미널 3: 관리자 앱
npm run dev:admin
```

- **보드판이 안 보일 때**: `npm run dev:board` 를 실행해 빙고판 앱 창을 따로 띄워야 합니다.
- **게임 시작 눌렀는데 번호뽑기/보드가 안 바뀔 때**: 위 세 앱이 모두 실행 중인지, 각 창에서 개발자도구 콘솔에 에러가 없는지 확인하세요.

## 🎮 사용 방법

### 게임 시작 순서

1. **관리자 앱**에서 "게임 시작" 버튼 클릭
2. **추첨 앱**에서 "번호 뽑기" 버튼 활성화됨
3. **빙고판 앱**이 준비 상태에서 게임 중 상태로 전환

### 게임 진행

1. **추첨 앱**에서 "번호 뽑기" 클릭
2. 1~50 중 랜덤 번호가 추첨됨
3. **빙고판 앱**에 실시간으로 해당 번호가 표시됨 (불이 들어옴)
4. 가로/세로/대각선 빙고 완성 시 줄이 그어짐

### 게임 리셋

1. **관리자 앱**에서 "리셋" 버튼 클릭
2. 모든 앱이 초기 상태로 돌아감
3. 빙고판이 새로운 랜덤 배치로 재생성됨

## 📊 Supabase 테이블 구조

### game_state
- `id`: 1 (고정)
- `status`: 'ready' | 'playing' | 'finished'
- `updated_at`: 마지막 업데이트 시간

### drawn_numbers
- `id`: 자동 증가
- `number`: 1~50 추첨된 번호
- `drawn_at`: 추첨 시간

### bingo_lines (선택사항)
- `id`: 자동 증가
- `line_type`: 'horizontal' | 'vertical' | 'diagonal'
- `line_index`: 줄 번호
- `completed_at`: 완성 시간
- `completing_number`: 빙고를 완성시킨 번호

## 🔧 트러블슈팅

### Supabase 연결 오류
- `.env` 파일의 URL과 KEY가 정확한지 확인
- Supabase 프로젝트가 활성화 상태인지 확인

### Realtime 동작 안 함
- Supabase > Database > Replication에서 테이블 활성화 확인
- 브라우저 개발자 도구 콘솔에서 에러 확인

### 앱이 실행되지 않음
- `node_modules` 폴더 삭제 후 재설치
- Node.js 버전 확인 (v18 이상 권장)

## 📝 개발 참고사항

- 각 앱은 완전히 독립적으로 실행됨
- Supabase Realtime을 통해서만 통신
- 환경변수는 각 앱의 main.js에서 로드됨
- preload.js에서 Supabase 클라이언트 생성

## 🎯 향후 개선 사항

- [ ] Three.js 3D 애니메이션 추가
- [ ] 빙고 완성 시 효과음 추가
- [ ] 게임 이력 저장 기능
- [ ] 다중 빙고판 지원
- [ ] 사용자 인증 추가
