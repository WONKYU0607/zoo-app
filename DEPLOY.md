# 서버 올리기

관리자 권한 명령 프롬프트에서 zoo-app 폴더로 이동한 뒤,

    cd functions
    npm install
    cd ..
    firebase deploy --only functions,database

프로젝트 이름은 .firebaserc 에 넣어 뒀으니 --project 를 안 붙여도 된다.

## 고친 것

- functions/package.json 의 firebase-functions 를 5 → 6, firebase-admin 12 → 13,
  Node 20 → 22 로 올렸다. 낡은 버전 때문에 "Cannot determine backend specification"
  오류가 났다. 컨테이너에서 실제로 불러와 함수 4개가 나오는 것을 확인했다.
- firebase.json 의 runtime 도 nodejs22 로 맞췄다.
- .firebaserc 를 넣어 프로젝트를 지정했다.

## 주의

Blaze 요금제는 상한이 없다. 콘솔에서 예산 알림을 걸어 두는 것이 안전하다.
