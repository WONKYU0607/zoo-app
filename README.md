# 동물의 왕국 (Zoo President)

## 실행

    npm install
    npm run dev        # 개발 서버
    npm run build      # dist 로 빌드

## 앱으로 감싸기

    npm i -D @capacitor/cli @capacitor/core @capacitor/android
    npx cap add android
    npm run sync       # 빌드 + 안드로이드로 복사
    npx cap open android

## 구조

    index.html            껍데기. 화면 자리(section)만 있다
    src/main.js           화면을 붙이고 nav 를 켠다
    src/state.js          게임 상태와 방 조건. Firebase 를 붙일 곳
    src/nav.js            화면 전환, 설정 창, 언어
    src/screens/*.js      화면별 코드. 각자 자기 구역 안에서만 document 를 본다
    src/styles/*.css      화면별 CSS. 빌드할 때 #화면id 로 묶인다
    src/lib/assets.js     그림 경로
    public/assets/        그림 파일

## 다음에 할 일

- 익명 로그인, 계정 점수·티어(1000점 단위), 티켓
- 방 만들기·참가를 Firestore 로
- 실시간 대전 (서버가 차례와 카드를 판정)
- 이탈 시 봇 대체와 패널티

## 정해진 규칙

- 상위 floor(인원/2) 명만 점수 획득, 나머지는 변동 없음
- 봇 판도 점수 지급
- 티어는 1000점 단위 숫자
- 동점은 그대로 동점
