/* 진입점. **웹판이면 게임을 띄우지 않는다** (lib/webgate.js) — 앱·검사용 빌드·개발 서버만 main.js 를 불러온다 */
import { webBlocked, showWebOnly } from "./lib/webgate.js";

if (webBlocked()) showWebOnly();
else import("./main.js");
