/* 이용약관과 개인정보처리방침.

   **앱 안에서 보여 주는 글과 웹 페이지의 글이 같아야 한다.** 따로 적어 두면
   한쪽만 고치고 다른 쪽은 옛 글이 남는다. 그래서 여기 한 군데에만 적고
   앱도 웹 페이지도 이 글을 쓴다.

   플레이 스토어에 낼 주소도 이 글로 만든 페이지다.

   고칠 때 같이 볼 것: 실제로 모으는 것이 바뀌면 여기도 바꿔야 한다.
   지금 모으는 것 — 구글 계정(이메일·이름·사진), 닉네임·점수·전적, 광고용 기기 정보 */

export const CONTACT = "dnjsrb980607@gmail.com";
export const UPDATED = "2026-09-24";

export const TERMS = {
  ko: {
    title: "이용약관",
    body: `제1조 (목적)
이 약관은 "동물의 왕국"(이하 "게임")을 이용하는 데 필요한 사항을 정합니다.

제2조 (계정)
1. 구글 계정으로 로그인하거나 게스트로 이용할 수 있습니다.
2. 게스트로 이용하면 랭킹에 오르지 않으며, 앱을 지우면 기록이 사라질 수 있습니다.
3. 다른 사람의 계정을 쓰거나 닉네임을 도용해서는 안 됩니다.

제3조 (이용권, 이른바 티켓)
1. 게임을 한 판 시작할 때 이용권 한 장이 쓰입니다.
2. 이용권은 시간이 지나면 일정량까지 다시 찹니다.
3. 광고를 끝까지 보면 이용권을 받을 수 있습니다.
4. 이용권은 현금으로 바꿀 수 없고, 사고팔 수 없습니다.

제4조 (금지하는 일)
1. 게임을 고쳐서 돌리거나, 정상적이지 않은 방법으로 이용권·점수를 얻는 일
2. 다른 이용자를 괴롭히거나 불쾌하게 하는 닉네임·표현을 쓰는 일
3. 게임 서버에 부담을 주는 일

제5조 (서비스 중단)
점검·고장·천재지변 등으로 게임을 잠시 멈출 수 있습니다. 미리 알릴 수 있으면 알립니다.

제6조 (책임)
게임은 무료로 제공되며, 이용에 따른 손해에 대해 법이 정한 범위에서 책임집니다.

제7조 (약관 변경)
약관이 바뀌면 앱 안에서 알립니다. 바뀐 뒤에도 계속 이용하면 동의한 것으로 봅니다.

문의: ${CONTACT}`,
  },
  en: {
    title: "Terms of Service",
    body: `1. Purpose
These terms cover the use of "Zoo President" (the "Game").

2. Accounts
You may sign in with Google or play as a guest. Guests do not appear on the
leaderboard and may lose their records if the app is removed. Do not use another
person's account or impersonate others.

3. Tickets
Starting a game uses one ticket. Tickets refill over time up to a limit, and you
can earn one by watching an ad to the end. Tickets have no cash value and cannot
be sold or transferred.

4. Prohibited use
Modifying the game, obtaining tickets or scores by abnormal means, using
offensive nicknames, or placing undue load on the servers.

5. Interruptions
The service may pause for maintenance, faults, or events beyond our control.
We give notice where possible.

6. Liability
The Game is provided free of charge. Liability is limited to the extent permitted
by law.

7. Changes
Changes to these terms are announced in the app. Continued use after a change
means you accept it.

Contact: ${CONTACT}`,
  },
};

export const PRIVACY = {
  ko: {
    title: "개인정보처리방침",
    body: `"동물의 왕국"(이하 "게임")이 어떤 정보를 어떻게 다루는지 알려 드립니다.

1. 모으는 정보
· 구글로 로그인한 경우: 이메일 주소, 이름, 프로필 사진
· 게스트로 이용한 경우: 계정을 구분하는 임의의 번호
· 게임 기록: 닉네임, 점수, 전적, 이용권 수
· 광고: 구글이 광고를 띄우기 위해 기기 정보(광고 식별자 등)를 씁니다

2. 쓰는 곳
· 로그인과 계정 구분
· 랭킹과 전적 표시
· 부정 이용 확인
· 광고 노출

3. 맡겨 두는 곳
· 구글 파이어베이스 — 계정과 게임 기록 보관
· 구글 애드몹 — 광고 노출
각 회사의 처리방침은 아래에서 볼 수 있습니다.
https://firebase.google.com/support/privacy
https://policies.google.com/privacy

4. 얼마나 두는가
계정을 지울 때까지 보관하고, 지우면 지체 없이 파기합니다.

5. 광고 개인화
기기 설정에서 광고 식별자를 초기화하거나 개인화를 끌 수 있습니다.
유럽 등 일부 지역에서는 앱을 처음 켤 때 구글이 제공하는 동의 창이 뜹니다.
그 창에서 선택을 바꿀 수 있습니다.

6. 어린이
이 게임은 어린이를 대상으로 만들어지지 않았습니다.

7. 권리
자신의 정보를 보거나 지워 달라고 요청할 수 있습니다. 아래로 연락해 주세요.

8. 계정 지우기
앱의 설정에서 계정을 지우거나, 아래 주소로 요청하면 계정과 기록을 모두 지웁니다.

문의: ${CONTACT}
마지막 수정: ${UPDATED}`,
  },
  en: {
    title: "Privacy Policy",
    body: `This explains what "Zoo President" (the "Game") collects and how it is used.

1. What we collect
· Google sign-in: email address, name, profile photo
· Guest play: a random identifier for the account
· Game records: nickname, score, match history, ticket count
· Ads: Google uses device information (such as an advertising ID) to serve ads

2. How it is used
Signing in, showing rankings and history, checking for abuse, and serving ads.

3. Processors
· Google Firebase — accounts and game records
· Google AdMob — advertising
https://firebase.google.com/support/privacy
https://policies.google.com/privacy

4. Retention
Kept until the account is deleted, then destroyed without delay.

5. Ad personalisation
You can reset your advertising ID or turn off personalisation in device settings.
In some regions a Google consent form appears when the app first starts, and you
can change your choice there.

6. Children
This game is not directed at children.

7. Your rights
You may ask to see or delete your data at the address below.

8. Deleting your account
Delete your account in the app's settings, or write to the address below and we
will remove the account and its records.

Contact: ${CONTACT}
Last updated: ${UPDATED}`,
  },
};
